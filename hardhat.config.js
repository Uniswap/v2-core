require('@nomiclabs/hardhat-ganache');
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
// require('@nomiclabs/hardhat-truffle5');
require('@nomiclabs/hardhat-etherscan');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.17',
  networks: {
    local: {
      url: 'http://localhost:8545',
      accounts: ['0x9bce709a035954deb674a4538ac91cf90518777c98d608c008a31ef700814ffd'], // Try stealing the funds in this
      chainId: 1337,
    },
  },
};
