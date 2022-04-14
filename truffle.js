module.exports = {
  solc: {
    optimizer: {
      enabled: true,
      runs: 999999
    }
  },
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      gas: 6000000,
      gasPrice: 40000000000,
      network_id: '*' // Match any network id
    }
  },
  mocha: {
    enableTimeouts: false
  }
};
