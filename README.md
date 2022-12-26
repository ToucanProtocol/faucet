# What is the Faucet?

The Faucet is a contract that allows users to claim free tokens for the Toucan ecosystem (like TCO2s, BCT, NCT) on testnet networks.

For current deployments, see the `./deployments` folder.

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
