require('@nomiclabs/hardhat-ganache');
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
// require('@nomiclabs/hardhat-truffle5');
require('@nomiclabs/hardhat-etherscan');

require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.17',
  networks: {
    local: {
      url: 'http://localhost:8545',
      accounts: ['0x9bce709a035954deb674a4538ac91cf90518777c98d608c008a31ef700814ffd'], // Try stealing the funds in this
      chainId: 1337,
    },
    bsc_testnet: {
      url: 'https://bsctestapi.terminet.io/rpc',
      accounts: [process.env.PRIVATE_KEY],
      chainId: 97
    },
    bitgert_mainnet: {
      url: 'https://rpc.icecreamswap.com',
      accounts: [process.env.PRIVATE_KEY],
      chainId: 32520
    },
    telos_mainnet: {
      url: 'https://rpc2.eu.telos.net/evm',
      accounts: [process.env.PRIVATE_KEY],
      chainId: 40
    },
    gatechain_mainnet: {
      url: 'https://evm.gatenode.cc',
      accounts: [process.env.PRIVATE_KEY],
      chainId: 86
    },
    ethereum_mainnet: {
      url: 'https://1rpc.io/eth',
      accounts: [process.env.PRIVATE_KEY],
      chainId: 1
    },
    matic_mainnet: {
      url: 'https://matic.slingshot.finance',
      accounts: [process.env.PRIVATE_KEY],
      chainId: 137
    },
    avalanche_mainnet: {
      url: 'https://1rpc.io/avax/c',
      accounts: [process.env.PRIVATE_KEY],
      chainId: 43114
    }
  },
  etherscan: {
    apiKey: {
      bscTestnet: process.env.BSC_API_KEY,
      bitgert: process.env.BSC_API_KEY
    },
    customChains: [{
      network: 'bitgert',
      chainId: 32520,
      urls: {
        apiURL: 'https://brisescan.com/api',
        browserURL: 'https://brisescan.com'
      }
    }]
  }
};
