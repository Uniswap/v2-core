# Dynamic Automated Market Maker
## Introduction
[![built-with openzeppelin](https://img.shields.io/badge/built%20with-OpenZeppelin-3677FF)](https://docs.openzeppelin.com/)
[![Build Status](https://api.travis-ci.com/dynamic-amm/smart-contracts.svg?branch=master&status=passed)](https://travis-ci.com/github/KyberNetwork/kyber_reserves_sc)

This repository contains the dynamic-amm smart contracts.
For more details, please visit the white paper([dynamic fee](https://github.com/dynamic-amm/dmm-protocol/blob/main/xyz.pdf)  and [amplfication algorithm](https://github.com/dynamic-amm/dmm-protocol/blob/main/apr_v2.pdf))and our [change log](CHANGELOG.md) (compared to uniswap)

## Package Manager
We use `yarn` as the package manager. You may use `npm` and `npx` instead, but commands in bash scripts may have to be changed accordingly.

## Requirements
- The following assumes the use of `node@>=10`
# Setup
For interactions or contract deployments on public testnets / mainnet, create a .env file specifying your private key and infura api key, with the following format:
```
INFURA_API_KEY = 'xxxxx'
ETHERSCAN_API_KEY = 'xxxxx'
PRIVATE_KEY = 'xxxxx'
MATIC_VIGIL_KEY = 'xxxxx'
```

## Install Dependencies

`yarn`

## Compile Contracts

`yarn compile`

## Run Tests

`yarn test`

## Run coverage

`./coverage.sh`