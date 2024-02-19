// SPDX-FileCopyrightText: 2023 Toucan Labs
//
// SPDX-License-Identifier: LicenseRef-Proprietary

// Explicit import of hardhat plugins are required to obtain type extensions
// when compiling without hardhat.config.ts (e.g. via lint-staged).  Extensions
// are things like 'getNamedAccounts' and 'upgrades' on HardhatRuntimeEnvironment.
import { FakeContract, smock } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { use, expect } from "chai";
import chaiAsPromised from "chai-as-promised";

import { solidity } from "ethereum-waffle";
import { Faucet, IERC20, IToucanContractRegistry } from "../../typechain";
import { ethers, network } from "hardhat";
import { BigNumber } from "ethers";

use(solidity);
use(chaiAsPromised);
use(smock.matchers);

describe("Faucet", async () => {
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let fakePool1: FakeContract<IERC20>;
  let fakePool2: FakeContract<IERC20>;
  let fakePool3: FakeContract<IERC20>;
  let fakeToucanContractRegistry: FakeContract<IToucanContractRegistry>;
  let faucet: Faucet;
  let maxWithdrawalAmount: BigNumber;
  let timeoutLimit: BigNumber;

  beforeEach(async () => {
    [owner, alice] = await ethers.getSigners();

    fakeToucanContractRegistry = await smock.fake<IToucanContractRegistry>(
      "IToucanContractRegistry"
    );
    fakeToucanContractRegistry.checkERC20.returns(true);

    fakePool1 = await smock.fake<IERC20>("IERC20");
    fakePool1.transfer.returns(true);
    fakePool1.transferFrom.returns(true);

    fakePool2 = await smock.fake<IERC20>("IERC20");
    fakePool3 = await smock.fake<IERC20>("IERC20");

    const faucetFactory = await ethers.getContractFactory("Faucet");
    faucet = (await faucetFactory.deploy(fakeToucanContractRegistry.address, [
      fakePool1.address,
      fakePool2.address,
    ])) as Faucet;

    timeoutLimit = await faucet.TIMEOUT_LIMIT();
    maxWithdrawalAmount = await faucet.MAX_WITHDRAWAL_AMOUNT();
  });

  describe("setPoolEligible", async () => {
    it("reverts when called by a non-owner", async () => {
      await expect(
        faucet.connect(alice).setPoolEligible(fakePool1.address, false)
      ).revertedWith("Ownable: caller is not the owner");
    });

    it("sets the pool as eligible", async () => {
      await faucet.setPoolEligible(fakePool3.address, true);

      const result = await faucet.isPoolEligible(fakePool3.address);

      expect(result).equal(true);
    });

    it("sets the pool as uneligible", async () => {
      await faucet.setPoolEligible(fakePool2.address, false);

      const result = await faucet.isPoolEligible(fakePool2.address);

      expect(result).equal(false);
    });
  });

  describe("getTokenBalance", async () => {
    const balancePool1 = BigNumber.from(42);
    const balancePool2 = BigNumber.from(3);

    beforeEach(async () => {
      fakePool1.balanceOf.returns(balancePool1);
      fakePool2.balanceOf.returns(balancePool2);
    });

    it("returns the balance of a single token", async () => {
      const result = await faucet.getTokenBalances([fakePool1.address]);

      expect(result).eql([balancePool1]);
    });

    it("returns the aggregated balance of a multiple tokens", async () => {
      const result = await faucet.getTokenBalances([
        fakePool1.address,
        fakePool2.address,
      ]);

      expect(result).eql([balancePool1, balancePool2]);
    });
  });

  describe("deposit", async () => {
    it("reverts when the address is neither an eligible pool nor a valid toucan contract", async () => {
      fakeToucanContractRegistry.checkERC20.reset();
      fakeToucanContractRegistry.checkERC20.returns(false);
      await faucet.setPoolEligible(fakePool1.address, false);

      await expect(faucet.deposit(fakePool3.address, 42)).revertedWith(
        "Token rejected"
      );
    });

    it("transfers the given amount of tokens from the sender to the faucet", async () => {
      const transferredAmount = BigNumber.from(42);
      await faucet.connect(alice).deposit(fakePool1.address, transferredAmount);

      expect(fakePool1.transferFrom).calledOnceWith(
        alice.address,
        faucet.address,
        transferredAmount
      );
    });

    it("emits a Deposited event", async () => {
      const transferredAmount = BigNumber.from(42);
      await expect(
        faucet.connect(alice).deposit(fakePool1.address, transferredAmount)
      )
        .to.emit(faucet, "Deposited")
        .withArgs(fakePool1.address, transferredAmount);
    });
  });

  describe("checkIfWithdrawalTimeout", async () => {
    it("returns false if the caller hasn't withdrawn", async () => {
      const result = await faucet.checkIfWithdrawalTimeout();

      expect(result).equal(false);
    });

    it("returns false if the caller withrew more than 30 seconds ago", async () => {
      await faucet.withdraw(fakePool1.address, 42);
      const currentTimestamp = (await ethers.provider.getBlock("latest"))
        .timestamp;
      network.provider.send("evm_setNextBlockTimestamp", [
        timeoutLimit.toNumber() + currentTimestamp + 1,
      ]);
      await network.provider.send("evm_mine");

      const result = await faucet.checkIfWithdrawalTimeout();

      expect(result).equal(false);
    });

    it("returns true if caller withrew less than 30 seconds ago", async () => {
      await faucet.withdraw(fakePool1.address, 42);

      const result = await faucet.checkIfWithdrawalTimeout();

      expect(result).equal(true);
    });
  });

  describe("withdraw", async () => {
    it("reverts when the address is neither an eligible pool nor a valid toucan contract", async () => {
      fakeToucanContractRegistry.checkERC20.reset();
      fakeToucanContractRegistry.checkERC20.returns(false);
      await faucet.setPoolEligible(fakePool1.address, false);

      await expect(faucet.deposit(fakePool3.address, 42)).revertedWith(
        "Token rejected"
      );
    });

    it("reverts when on withdrawal timeout", async () => {
      await faucet.withdraw(fakePool1.address, 42);

      await expect(faucet.withdraw(fakePool1.address, 42)).revertedWith(
        "Cannot withdraw that often"
      );
    });

    it("reverts when withdrawing more than the maximum allowed amount", async () => {
      await expect(
        faucet.withdraw(fakePool1.address, maxWithdrawalAmount.add(1))
      ).revertedWith("Amount too high");
    });

    it("transfers the given amount of tokens from the faucet to the sender", async () => {
      const transferredAmount = BigNumber.from(42);
      await faucet
        .connect(alice)
        .withdraw(fakePool1.address, transferredAmount);

      expect(fakePool1.transfer).calledOnceWith(
        alice.address,
        transferredAmount
      );
    });

    it("emits a Withdrawn event", async () => {
      const transferredAmount = BigNumber.from(42);

      await expect(
        faucet.connect(alice).withdraw(fakePool1.address, transferredAmount)
      )
        .to.emit(faucet, "Withdrawn")
        .withArgs(alice.address, fakePool1.address, transferredAmount);
    });

    it("succeeds when called a second time after the timeout", async () => {
      const transferredAmount = BigNumber.from(42);
      await faucet
        .connect(alice)
        .withdraw(fakePool1.address, transferredAmount);
      const currentTimestamp = (await ethers.provider.getBlock("latest"))
        .timestamp;
      network.provider.send("evm_setNextBlockTimestamp", [
        timeoutLimit.toNumber() + currentTimestamp + 1,
      ]);
      await network.provider.send("evm_mine");

      await expect(
        faucet.connect(alice).withdraw(fakePool1.address, transferredAmount)
      ).to.emit(faucet, "Withdrawn");
    });
  });

  describe("ownerWithdraw", async () => {
    it("reverts when called by a non owner", async () => {
      await expect(
        faucet.connect(alice).ownerWithdraw(fakePool1.address, 42)
      ).revertedWith("not the owner");
    });

    it("transfers from given address to sender the given amount", async () => {
      const transferredAmount = BigNumber.from(42);

      await faucet.ownerWithdraw(fakePool1.address, transferredAmount);

      expect(fakePool1.transfer).calledWith(owner.address, transferredAmount);
    });
  });
});
