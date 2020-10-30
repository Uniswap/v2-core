usePlugin('@nomiclabs/buidler-truffle5');
usePlugin('@nomiclabs/buidler-ethers');
usePlugin('@nomiclabs/buidler-web3');
usePlugin('buidler-contract-sizer');

require('dotenv').config();

task('accounts', 'Prints the list of accounts', async () => {
  const accounts = await web3.eth.getAccounts();

  for (const account of accounts) {
    console.log(account);
  }
});

module.exports = {
  solc: {
    version: '0.6.12',
    optimizer: {
      enabled: true,
      runs: 999999,
    },
  },
  defaultNetwork: 'buidlerevm',
  networks: {
    buidlerevm: {
      blockGasLimit: 12500000,
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
      timeout: 20000,
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
      timeout: 20000,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
      timeout: 20000,
    },
  },
  mocha: {
    enableTimeouts: false,
  },
  paths: {
    sources: './contracts',
    tests: './test',
  },
};
