import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      chainId: 1,
      blockGasLimit: 999999999,
    },
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 9999,
      },
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
};

export default config;
