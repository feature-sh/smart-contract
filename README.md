# FEATURE

## Getting Started

```
cp .env.example .env
npx hardhat test test/feature.js
npx hardhat test test/feature-erc20.js
```

## Deploy

### Feature

`npx hardhat run scripts/feature-deploy.js --network <network>`

### Centralized Arbitrator

`npx hardhat run scripts/centralized-appealable-arbitrator-deploy.js --network <network>`

## Etherscan Verification

```
npx hardhat clean
npx hardhat verify --network <network> <smart contract address> <Argument1...>
```

## Run Test with event logs

`npx hardhat test --logs`
