usePlugin('@nomiclabs/buidler-truffle5');
usePlugin('buidler-contract-sizer');

task('accounts', 'Prints the list of accounts', async () => {
  const accounts = await web3.eth.getAccounts();

  for (const account of accounts) {
    console.log(account);
  }
});

module.exports = {
  solc: {
    version: '0.6.12', // Fetch exact version from solc-bin (default: truffle's version)
    docker: true, // Use "0.5.1" you've installed locally with docker (default: false)
    settings: {
      // See the solidity docs for advice about optimization and evmVersion
      optimizer: {
        enabled: true,
        runs: 999999,
      },
      evmVersion: 'istanbul',
    },
  },
  network: {
    buidlerevm: {
      blockGasLimit: 12500000,
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
