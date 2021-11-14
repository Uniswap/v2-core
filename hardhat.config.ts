import * as dotenv from 'dotenv';
dotenv.config();

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "hardhat-abi-exporter";
import "@typechain/hardhat";

export default {
    defaultNetwork: "local",
    solidity: {
        compilers: [
            {
                version: "0.5.16",
                settings: {
                    evmVersion: "istanbul",
                }
            },
            {
                version: "0.8.2",
            }
        ]

    },
    networks: {
        local: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
        },
        milkomeda: {
            url: 'http://use-util.cloud.milkomeda.com:8545/',
            chainId: 1000,
            accounts: {
                mnemonic: process.env.MNEMONIC ? process.env.MNEMONIC : '',
            },
        }
    },
    typechain: {
        outDir: "./dist/types",
        target: "ethers-v5",
    },
    abiExporter: {
        path: "./dist/abis",
        clear: false,
        flat: true,
    }
}