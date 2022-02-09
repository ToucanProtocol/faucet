import { ethers } from "hardhat";

async function main() {
  const FaucetFactory = await ethers.getContractFactory("TCO2Faucet");
  const faucet = await FaucetFactory.deploy();

  await faucet.deployed();

  console.log("TCO2 Faucet deployed to: ", faucet.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
