module.exports = {
  providerOptions: {
    default_balance_ether: 100000000000000,
    total_accounts: 20
  },
  skipFiles: ['mock/', 'interfaces/'],
  istanbulReporter: ['html', 'json']
};
