const {artifacts} = require('hardhat');

const BN = web3.utils.BN;

async function main () {
  const accounts = await web3.eth.getAccounts();
  // We get the contract to deploy

  let amount = new BN(10).pow(new BN(27));
  const TestToken = await artifacts.require('TestToken');
  const token = await TestToken.new('token 1', 't1', amount);
  console.log('TestToken deployed to:', token.address);

  const MockFeeOnTransferERC20 = artifacts.require('MockFeeOnTransferERC20');
  const token2 = await MockFeeOnTransferERC20.new('fee on transfer token', 'FOT', amount);
  console.log('FOT token deployed to:', token2.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
