/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 import * as dotenv from "dotenv";

 dotenv.config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 99999,
          },
        },
      },
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 99999,
          },
        },
      },
    ],
  },
};
