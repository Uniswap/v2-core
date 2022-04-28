const BigNumber = web3.BigNumber;
const ERC20 = artifacts.require('TestERC20');
const QuasarFactory = artifacts.require('QuasarFactory');
const { expectEvent } = require('@openzeppelin/test-helpers');

require('chai').use(require('chai-as-promised')).use(require('chai-bignumber')(BigNumber)).should();

contract('Core', ([account1, account2, account3]) => {
  let token1;
  let token2;
  let factory;

  before(async () => {
    token1 = await ERC20.new(web3.utils.toWei('300000000'));
    token2 = await ERC20.new(web3.utils.toWei('300000000'));
    factory = await QuasarFactory.new();
  });

  it('should create pair', async () => {
    expectEvent(await factory.createPair(token1.address, token2.address), 'PairCreated');
  });
});
