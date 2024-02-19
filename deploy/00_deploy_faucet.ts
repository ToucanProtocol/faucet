import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { deploymentAddresses } from "../utils/constants";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { CONTRACT_REGISTRY_ADDRESS, BCT_ADDRESS, NCT_ADDRESS } =
    deploymentAddresses[hre.network.name];

  if (!CONTRACT_REGISTRY_ADDRESS || !BCT_ADDRESS || !NCT_ADDRESS) {
    throw new Error(`Missing deployment addresses for ${hre.network.name}`);
  }

  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  if (!deployer) {
    throw new Error("Missing deployer address");
  }

  await deploy("Faucet", {
    from: deployer,
    args: [CONTRACT_REGISTRY_ADDRESS, [BCT_ADDRESS, NCT_ADDRESS]],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};
export default func;
