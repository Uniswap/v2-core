const {artifacts} = require('hardhat');
const BN = web3.utils.BN;
const Helper = require('./helper');

const DMMFactory = artifacts.require('DMMFactory');
const DMMRouter02 = artifacts.require('DMMRouter02');
const DMMPool = artifacts.require('DMMPool');
const FeeTo = artifacts.require('FeeTo');
const MockKyberDao = artifacts.require('MockKyberDao');
const WETH = artifacts.require('WETH9');
const TestToken = artifacts.require('TestToken');

let feeToSetter;
let daoOperator;

let weth;
let token;

contract('FeeTo', accounts => {
  before('setup', async () => {
    feeToSetter = accounts[1];
    daoOperator = accounts[2];

    weth = await WETH.new();
    token = await TestToken.new('test', 't1', Helper.expandTo18Decimals(100000));
  });

  it('demo feeTo', async () => {
    let factory = await DMMFactory.new(feeToSetter);
    await factory.createPool(weth.address, token.address, new BN(10000));
    const poolAddress = await factory.getUnamplifiedPool(weth.address, token.address);
    const pool = await DMMPool.at(poolAddress);

    /// setup dao and feeTo
    let epoch = new BN(1);
    const dao = await MockKyberDao.new(new BN(0), new BN(0), epoch, new BN(0));
    const feeTo = await FeeTo.new(dao.address, daoOperator);
    await factory.setFeeConfiguration(feeTo.address, new BN(1000), {from: feeToSetter});
    await feeTo.setAllowedToken(pool.address, true, {from: daoOperator});

    /// setup router
    let router = await DMMRouter02.new(factory.address, weth.address);

    await token.approve(router.address, Helper.MaxUint256);
    await router.addLiquidityETH(
      token.address,
      poolAddress,
      Helper.expandTo18Decimals(100),
      new BN(0),
      new BN(0),
      accounts[0],
      Helper.MaxUint256,
      {value: Helper.expandTo18Decimals(10)}
    );

    let txResult = await router.swapExactETHForTokens(
      new BN(0),
      [poolAddress],
      [weth.address, token.address],
      accounts[0],
      Helper.MaxUint256,
      {
        value: Helper.expandTo18Decimals(1)
      }
    );
    console.log(`gas used when swap with _mintFee: ${txResult.receipt.gasUsed}`);
    /// test gascost with non-zero storage cost
    await dao.advanceEpoch();
    await feeTo.finalize(pool.address, new BN(1));
    txResult = await router.swapExactETHForTokens(
      new BN(0),
      [poolAddress],
      [weth.address, token.address],
      accounts[0],
      Helper.MaxUint256,
      {
        value: Helper.expandTo18Decimals(1)
      }
    );
    console.log(`gas used when swap with _mintFee: ${txResult.receipt.gasUsed}`);

    console.log(await feeTo.rewardsPerEpoch(new BN(1), pool.address));
  });
});
