# What is the Faucet?

The Faucet is a contract that allows users to claim free tokens for the Toucan ecosystem (like TCO2s, BCT, NCT) on testnet networks.

It currently is deployed on the following networks:

- Mumbai: [0x0564A412E44dE08fd039E67FC9B323Dc521eF410](https://mumbai.polygonscan.com/address/0x0564A412E44dE08fd039E67FC9B323Dc521eF410)
- Alfajores: [0x343cbBb380B6705Bdc8b587c614acBD4A541Ca34](https://alfajores.celoscan.io/address/0x343cbBb380B6705Bdc8b587c614acBD4A541Ca34)

# Faucet Deployment Check List

```bash
# install dependencies
yarn install

# test the contract
yarn hardhat test

# deploy the contract
yarn hardhat deploy --network <network>

# verify the contract
yarn hardhat verify --network <network to verify for> --contract "contracts/Faucet.sol:Faucet" <Faucet address> <toucan contract registry address> <BCT address> <NCT address>
```
