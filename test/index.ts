import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Faucet__factory, IERC20__factory } from "../typechain";

import deposit from "../utils/deposit";
import withdraw from "../utils/withdraw";

const TCO2_VCS_439_2008: string = "0xa5831eb637dff307395b5183c86b04c69c518681";
const TCO2_VCS_1190_2018: string = "0xD3Ad9Dc261CA44b153125541D66Af2CF372C316a";
const TCO2_VCS_674_2014: string = "0xF7e61e0084287890E35e46dc7e077d7E5870Ae27";

// and this is the address that I wish to deploy from
const myAddress: string = "0x721F6f7A29b99CbdE1F18C4AA7D7AEb31eb2923B";

describe("TCO2Faucet", function () {
  async function prepareEnvFixture() {
    if (network.name === "hardhat") {
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [myAddress],
      });
    }

    const owner = await ethers.getSigner(myAddress);
    const [addr1, addr2, ...addrs] = await ethers.getSigners();

    const FaucetFactory = (await ethers.getContractFactory(
      "Faucet",
      owner
    )) as Faucet__factory;
    const faucet = await FaucetFactory.deploy();

    const tco1 = IERC20__factory.connect(TCO2_VCS_439_2008, owner);
    const tco2 = IERC20__factory.connect(TCO2_VCS_1190_2018, owner);
    const tco3 = IERC20__factory.connect(TCO2_VCS_674_2014, owner);

    return { faucet, tco1, tco2, tco3, owner, addr1, addr2, addrs };
  }

  describe("Deposit", function () {
    it("Should deposit 1 TCO2_VCS_439_2008", async function () {
      const { faucet, tco1 } = await prepareEnvFixture();

      const amountToDeposit = "1.0";

      /**
       * we check my TCO2 before depositing some of it
       */
      const myTcoBalanceBefore = await tco1.balanceOf(myAddress);

      /**
       * we attempt to deposit an amount of TCO2 into the Faucet contract.
       * I have separated in the deposit() function for readability
       */
      await deposit(tco1, faucet, TCO2_VCS_439_2008, amountToDeposit);

      /**
       * we check the my TCO2 balance after depositing some of it
       * and we are expecting it to be less by the deposited amount
       */
      const myTcoBalanceAfter = await tco1.balanceOf(myAddress);
      const expectedTcoBalance = myTcoBalanceBefore.sub(
        ethers.utils.parseEther(amountToDeposit)
      );
      expect(myTcoBalanceAfter).to.eql(expectedTcoBalance);

      /**
       * we check the TCO2 balance of the contract to see if it changed.
       * Normally it should be equal to 1.0 as we redeploy a new Faucet contract before each test.
       */
      const faucetTcoBalance = await faucet.getTokenBalance(TCO2_VCS_439_2008);
      expect(ethers.utils.formatEther(faucetTcoBalance)).to.eql("1.0");
    });
  });

  describe("Withdraw", function () {
    it("Should withdraw 1 TCO2_VCS_439_2008", async function () {
      const { faucet, tco1 } = await prepareEnvFixture();

      const amountToWithdraw = "1.0";

      /**
       * we first deposit the amount that we want to withdraw because this is a freshly deployed
       * contract and has no TCO2 in its balance
       */
      await deposit(tco1, faucet, tco1.address, amountToWithdraw);

      /**
       * we check my TCO2 before depositing some of it
       */
      const myTcoBalanceBefore = await tco1.balanceOf(myAddress);

      /**
       * we attempt to withdraw an amount of TCO2 from the Faucet contract.
       * I have separated in the withdraw() function for readability
       */
      await withdraw(faucet, tco1.address, amountToWithdraw);

      /**
       * we check my TCO2 balance after withdrawing some of it from the faucet
       * and we are expecting it to be more by the withdrawn amount
       */
      const myTcoBalanceAfter = await tco1.balanceOf(myAddress);
      const expectedTcoBalance = myTcoBalanceBefore.add(
        ethers.utils.parseEther(amountToWithdraw)
      );
      expect(myTcoBalanceAfter).to.eql(expectedTcoBalance);

      /**
       * we check the TCO2 balance of the contract to see if it changed.
       * Normally it should be equal to 0.0 as we redeploy a new Faucet contract before each test.
       */
      const faucetTcoBalance = await faucet.getTokenBalance(tco1.address);
      expect(ethers.utils.formatEther(faucetTcoBalance)).to.eql("0.0");
    });

    it("Should withdraw 1 TCO2_VCS_674_2014", async function () {
      const { faucet, tco3 } = await prepareEnvFixture();

      const amountToWithdraw = "1.0";

      /**
       * we first deposit the amount that we want to withdraw because this is a freshly deployed
       * contract and has no TCO2 in its balance
       */
      await deposit(tco3, faucet, tco3.address, amountToWithdraw);

      /**
       * we check my TCO2 before depositing some of it
       */
      const myTcoBalanceBefore = await tco3.balanceOf(myAddress);

      /**
       * we attempt to withdraw an amount of TCO2 from the Faucet contract.
       * I have separated in the withdraw() function for readability
       */
      await withdraw(faucet, tco3.address, amountToWithdraw);

      /**
       * we check my TCO2 balance after withdrawing some of it from the faucet
       * and we are expecting it to be more by the withdrawn amount
       */
      const myTcoBalanceAfter = await tco3.balanceOf(myAddress);
      const expectedTcoBalance = myTcoBalanceBefore.add(
        ethers.utils.parseEther(amountToWithdraw)
      );
      expect(myTcoBalanceAfter).to.eql(expectedTcoBalance);

      /**
       * we check the TCO2 balance of the contract to see if it changed.
       * Normally it should be equal to 0.0 as we redeploy a new Faucet contract before each test.
       */
      const faucetTcoBalance = await faucet.getTokenBalance(tco3.address);
      expect(ethers.utils.formatEther(faucetTcoBalance)).to.eql("0.0");
    });

    it("Should revert the second transaction with a timeout", async () => {
      const { faucet, tco1 } = await prepareEnvFixture();

      const amountToDeposit = "2.0";
      const amountToWithdraw = "1.0";

      /**
       * we first deposit the amount that we want to withdraw because this is a freshly deployed
       * contract and has no TCO2 in its balance
       */
      await deposit(tco1, faucet, TCO2_VCS_439_2008, amountToDeposit);

      /**
       * we attempt the first withdrawal, which should work
       */
      await withdraw(faucet, TCO2_VCS_439_2008, amountToWithdraw);

      /**
       * we attempt the second withdrawal, which should not work
       * I decided to have the withdrawal function have a timeout to make sure that nobody spams the faucet
       */
      /**
       * TODO there is an issue with this test. The issue is with the test itself, not with the Solidity code.
       * When testing on my Mumbai fork, the test evaluates correctly. When testing on Mumbai itself,
       * the transaction still gets reverted (with the correct error), but the test doesn't see it.
       * Absolutely 0 idea why...
       */
      await expect(
        faucet.withdraw(
          TCO2_VCS_439_2008,
          ethers.utils.parseEther(amountToWithdraw),
          {
            gasLimit: 1200000,
          }
        )
      ).to.be.revertedWith("Cannot withdraw that often");
    });
  });
});
