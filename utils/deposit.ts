import { ethers } from "hardhat";
import {TCO2Faucet, ToucanCarbonOffsets} from "../typechain";
import { ContractTransaction } from "ethers";

const deposit = async (
  tco: ToucanCarbonOffsets,
  faucet: TCO2Faucet,
  tco2Address: string,
  amount: string
): Promise<ContractTransaction> => {
  // first we use have the TCO2 contract approve up the amount of unit to be used by the Faucet contract
  await tco.approve(faucet.address, ethers.utils.parseEther(amount));

  // we then deposit the amount of TCO2 into the DEX contract
  const depositTxn = await faucet.deposit(
    tco2Address,
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
