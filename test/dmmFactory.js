const TestToken = artifacts.require('TestToken');
const DMMFactory = artifacts.require('DMMFactory');
const DMMPool = artifacts.require('DMMPool');

const Helper = require('./helper');

const {expectRevert, constants} = require('@openzeppelin/test-helpers');
const {assert} = require('chai');
const BN = web3.utils.BN;

let tokenA;
let tokenB;
let factory;
let feeToSetter;
let feeTo;

contract('DMMFactory', function (accounts) {
  before('init', async () => {
    feeToSetter = accounts[1];
    feeTo = accounts[2];
    factory = await DMMFactory.new(feeToSetter);

    tokenA = await TestToken.new('test token A', 'A', Helper.expandTo18Decimals(10000));
    tokenB = await TestToken.new('test token B', 'B', Helper.expandTo18Decimals(10000));
  });

  it('create pool', async () => {
    const unamplifiedBps = new BN(10000);
    const ampBps = new BN(20000);
    await expectRevert(factory.createPool(tokenA.address, constants.ZERO_ADDRESS, unamplifiedBps), 'DMM: ZERO_ADDRESS');

    await expectRevert(factory.createPool(tokenA.address, tokenA.address, unamplifiedBps), 'DMM: IDENTICAL_ADDRESSES');

    await expectRevert(factory.createPool(tokenA.address, tokenB.address, new BN(9999)), 'DMM: INVALID_BPS');
    /// create unamplified pool
    await factory.createPool(tokenA.address, tokenB.address, unamplifiedBps);
    await expectRevert(factory.createPool(tokenA.address, tokenB.address, unamplifiedBps), 'DMM: UNAMPLIFIED_POOL_EXISTS');
    Helper.assertEqual(await factory.allPoolsLength(), 1);

    /// create amp pool
    await factory.createPool(tokenA.address, tokenB.address, ampBps);
    Helper.assertEqual(await factory.allPoolsLength(), 2);
    Helper.assertEqual(await factory.getPoolsLength(tokenA.address, tokenB.address), 2);

    let pool0 = await factory.getPoolAtIndex(tokenA.address, tokenB.address, new BN(0));
    assert(await factory.isPool(tokenA.address, tokenB.address, pool0), 'pool is not asserted');
  });

  it('setFeeConfiguration', async () => {
    await expectRevert(factory.setFeeConfiguration(feeTo, new BN(1000)), 'DMM: FORBIDDEN');
    await expectRevert(factory.setFeeConfiguration(feeTo, new BN(2000), {from: feeToSetter}), 'DMM: INVALID FEE');
    await expectRevert(factory.setFeeConfiguration(feeTo, new BN(0), {from: feeToSetter}), 'DMM: INVALID FEE');
    await factory.setFeeConfiguration(feeTo, new BN(1000), {from: feeToSetter});

    let config = await factory.getFeeConfiguration();
    assert(config[0] == feeTo, 'unexpected feTo');
    Helper.assertEqual(config[1], new BN(1000));
  });

  it('set feeToSetter', async () => {
    let newFeeToSetter = accounts[3];
    await expectRevert(factory.setFeeToSetter(newFeeToSetter), 'DMM: FORBIDDEN');
    await factory.setFeeToSetter(newFeeToSetter, {from: feeToSetter});

    assert((await factory.feeToSetter()) == newFeeToSetter, 'unexpected feeToSetter');
  });
});
