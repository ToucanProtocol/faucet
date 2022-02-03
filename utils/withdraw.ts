import { ethers } from "hardhat";
import {TCO2Faucet, ToucanCarbonOffsets} from "../typechain";
import { ContractTransaction } from "ethers";

const withdraw = async (
    tco: ToucanCarbonOffsets,
    faucet: TCO2Faucet,
    tco2Address: string,
    amount: string
): Promise<ContractTransaction> => {
    // we then withdraw the amount of TCO2 from the Faucet contract
    const depositTxn = await faucet.withdraw(
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

export default withdraw;
