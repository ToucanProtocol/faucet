export const deploymentAddresses: Record<string, Record<string, string>> = {
  hardhat: {
    // dummy addresses to deploy the faucet in a dev environment
    CONTRACT_REGISTRY_ADDRESS: "0x0000000000000000000000000000000000000000",
    BCT_ADDRESS: "0x0000000000000000000000000000000000000000",
    NCT_ADDRESS: "0x0000000000000000000000000000000000000000",
  },
  mumbai: {
    CONTRACT_REGISTRY_ADDRESS: "0x6739D490670B2710dc7E79bB12E455DE33EE1cb6",
    BCT_ADDRESS: "0xf2438A14f668b1bbA53408346288f3d7C71c10a1",
    NCT_ADDRESS: "0x7beCBA11618Ca63Ead5605DE235f6dD3b25c530E",
  },
  alfajores: {
    CONTRACT_REGISTRY_ADDRESS: "0x48E04110aa4691ec3E9493187e6e9A3dB613e6e4",
    BCT_ADDRESS: "0x4c5f90C50Ca9F849bb75D93a393A4e1B6E68Accb",
    NCT_ADDRESS: "0xfb60a08855389F3c0A66b29aB9eFa911ed5cbCB5",
  },
};
