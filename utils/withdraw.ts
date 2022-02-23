import { ethers } from "hardhat";
import { ContractTransaction } from "ethers";
import {Faucet} from "../typechain/Faucet";

const withdraw = async (
    faucet: Faucet,
    tokenAddress: string,
    amount: string
): Promise<ContractTransaction> => {
    // we then withdraw the amount of tokens from the Faucet contract
    const withdrawTxn = await faucet.withdraw(
        tokenAddress,
        ethers.utils.parseEther(amount),
        {
            gasLimit: 1200000,
        }
    );

    // wait for the transaction to be confirmed and return it
    await withdrawTxn.wait();
    return withdrawTxn;
};

export default withdraw;
