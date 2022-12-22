import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Faucet__factory, IERC20, IERC20__factory } from "../typechain";
import { deploymentAddresses } from "../utils/constants";

import deposit from "../utils/deposit";
import withdraw from "../utils/withdraw";

const TCO2s: Record<string, string> = {
  TCO2_VCS_439_2008: "0xa5831eb637dff307395b5183c86b04c69c518681",
  TCO2_VCS_1190_2018: "0xD3Ad9Dc261CA44b153125541D66Af2CF372C316a",
  TCO2_VCS_674_2014: "0xF7e61e0084287890E35e46dc7e077d7E5870Ae27",
};

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
    const { CONTRACT_REGISTRY_ADDRESS, BCT_ADDRESS, NCT_ADDRESS } =
      deploymentAddresses.mumbai;
    const faucet = await FaucetFactory.deploy(
      CONTRACT_REGISTRY_ADDRESS,
      BCT_ADDRESS,
      NCT_ADDRESS
    );

    let TCO2Contracts: Record<string, IERC20> = {};

    // loop over TCO2s
    for (const [tco2Name, tco2Address] of Object.entries(TCO2s)) {
      const tco2 = IERC20__factory.connect(tco2Address, owner);
      TCO2Contracts[tco2Name] = tco2;
    }

    return { faucet, TCO2Contracts, owner, addr1, addr2, addrs };
  }

  describe("Deposit", function () {
    for (const [tco2Name, tco2Address] of Object.entries(TCO2s)) {
      it(`Should deposit 1 ${tco2Name}`, async function () {
        const { faucet, TCO2Contracts } = await prepareEnvFixture();

        const amount = "1.0";

        const myTcoBalanceBefore = await TCO2Contracts[tco2Name].balanceOf(
          myAddress
        );

        await deposit(TCO2Contracts[tco2Name], faucet, tco2Address, amount);

        const myTcoBalanceAfter = await TCO2Contracts[tco2Name].balanceOf(
          myAddress
        );
        const expectedTcoBalance = myTcoBalanceBefore.sub(
          ethers.utils.parseEther(amount)
        );
        expect(myTcoBalanceAfter).to.eql(expectedTcoBalance);

        const faucetTcoBalance = await faucet.getTokenBalance(tco2Address);
        expect(ethers.utils.formatEther(faucetTcoBalance)).to.eql("1.0");
      });
    }
  });

  describe("Withdraw", function () {
    for (const [tco2Name, tco2Address] of Object.entries(TCO2s)) {
      it(`Should withdraw 1 ${tco2Name}`, async function () {
        const { faucet, TCO2Contracts } = await prepareEnvFixture();

        const amountToWithdraw = "1.0";

        await deposit(
          TCO2Contracts[tco2Name],
          faucet,
          tco2Address,
          amountToWithdraw
        );

        const myTcoBalanceBefore = await TCO2Contracts[tco2Name].balanceOf(
          myAddress
        );

        await withdraw(faucet, tco2Address, amountToWithdraw);

        const myTcoBalanceAfter = await TCO2Contracts[tco2Name].balanceOf(
          myAddress
        );
        const expectedTcoBalance = myTcoBalanceBefore.add(
          ethers.utils.parseEther(amountToWithdraw)
        );
        expect(myTcoBalanceAfter).to.eql(expectedTcoBalance);

        const faucetTcoBalance = await faucet.getTokenBalance(tco2Address);
        expect(ethers.utils.formatEther(faucetTcoBalance)).to.eql("0.0");
      });

      it(`Should revert withdrawing ${tco2Name} with a timeout error`, async () => {
        const { faucet, TCO2Contracts } = await prepareEnvFixture();

        const amountToDeposit = "2.0";
        const amountToWithdraw = "1.0";

        await deposit(
          TCO2Contracts[tco2Name],
          faucet,
          tco2Address,
          amountToDeposit
        );

        await withdraw(faucet, tco2Address, amountToWithdraw);

        await expect(
          faucet.withdraw(
            tco2Address,
            ethers.utils.parseEther(amountToWithdraw),
            {
              gasLimit: 1200000,
            }
          )
        ).to.be.revertedWith("Cannot withdraw that often");
      });
    }
  });
});
