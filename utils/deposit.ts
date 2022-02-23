import { ethers } from "hardhat";
import {BaseCarbonTonne, NatureCarbonTonne, ToucanCarbonOffsets} from "../typechain";
import { ContractTransaction } from "ethers";
import {Faucet} from "../typechain/Faucet";

const deposit = async (
  token: ToucanCarbonOffsets | BaseCarbonTonne | NatureCarbonTonne,
  faucet: Faucet,
  tokenAddress: string,
  amount: string
): Promise<ContractTransaction> => {
  // first we use have the TCO2 contract approve up the amount of unit to be used by the Faucet contract
  await token.approve(faucet.address, ethers.utils.parseEther(amount));

  // we then deposit the amount of TCO2 into the DEX contract
  const depositTxn = await faucet.deposit(
      tokenAddress,
    ethers.utils.parseEther(amount),
    {
      gasLimit: 1200000,
    }
  );

  // wait for the transaction to be confirmed and return it
  await depositTxn.wait();
  return depositTxn;
};

export default deposit;
