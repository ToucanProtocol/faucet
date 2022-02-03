import { ethers } from "hardhat";

async function main() {
  /**
   * this is the address of my Mumbai TCO2 (Toucan Protocol: TCO2-VCS-439-2008)
   * from Yingpeng HFC23 Decompostion Project
   */
  const tco2Address = "0xa5831eb637dff307395b5183c86b04c69c518681";
  const FaucetFactory = await ethers.getContractFactory("TCO2Faucet");
  const faucet = await FaucetFactory.deploy(tco2Address);

  await faucet.deployed();

  console.log("TCO2 Faucet deployed to: ", faucet.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
