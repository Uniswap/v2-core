const TestToken = artifacts.require('TestToken');
const KSFactory = artifacts.require('KSFactory');
const KSPool = artifacts.require('KSPool');

const Helper = require('./helper');

const {expectRevert, constants} = require('@openzeppelin/test-helpers');
const {assert} = require('chai');
const BN = web3.utils.BN;

let tokenA;
let tokenB;
let factory;
let feeToSetter;
let feeTo;

contract('KSFactory', function (accounts) {
  before('init', async () => {
    feeToSetter = accounts[1];
    feeTo = accounts[2];
    factory = await KSFactory.new(feeToSetter);

    tokenA = await TestToken.new('test token A', 'A', Helper.expandTo18Decimals(10000));
    tokenB = await TestToken.new('test token B', 'B', Helper.expandTo18Decimals(10000));
  });

  it('create pool', async () => {
    const unamplifiedBps = Helper.BPS;
    const ampBps = new BN(20000);
    const feeBps = new BN(300);
    await expectRevert(factory.createPool(tokenA.address, constants.ZERO_ADDRESS, unamplifiedBps, feeBps), 'KS: ZERO_ADDRESS');

    await expectRevert(factory.createPool(tokenA.address, tokenA.address, unamplifiedBps, feeBps), 'KS: IDENTICAL_ADDRESSES');

    await expectRevert(factory.createPool(tokenA.address, tokenB.address, new BN(9999), feeBps), 'KS: INVALID_BPS');

    await expectRevert(factory.createPool(tokenA.address, tokenB.address, unamplifiedBps, new BN(15000)), 'KS: FEE_OPTION_NOT_EXISTS');
    
    /// create an unamplified pool
    await factory.createPool(tokenA.address, tokenB.address, unamplifiedBps, feeBps);
    await expectRevert(factory.createPool(tokenA.address, tokenB.address, unamplifiedBps, feeBps), 'KS: UNAMPLIFIED_POOL_EXISTS');
    Helper.assertEqual(await factory.allPoolsLength(), 1);

    /// create an amp pool
    await factory.createPool(tokenA.address, tokenB.address, ampBps, feeBps);
    Helper.assertEqual(await factory.allPoolsLength(), 2);
    Helper.assertEqual(await factory.getPoolsLength(tokenA.address, tokenB.address), 2);

    let pool0 = await factory.getPoolAtIndex(tokenA.address, tokenB.address, new BN(0));
    assert(await factory.isPool(tokenA.address, tokenB.address, pool0), 'pool is not asserted');
  });

  it('setFeeConfiguration', async () => {
    await expectRevert(factory.setFeeConfiguration(feeTo, new BN(10000)), 'only fee setter');
    await expectRevert(factory.setFeeConfiguration(feeTo, new BN(20000), {from: feeToSetter}), 'KS: INVALID FEE');
    await expectRevert(factory.setFeeConfiguration(feeTo, new BN(0), {from: feeToSetter}), 'KS: INVALID FEE');
    
    await factory.setFeeConfiguration(feeTo, new BN(8000), {from: feeToSetter});  // 0.08%
    await factory.setFeeConfiguration(feeTo, new BN(10000), {from: feeToSetter}); // 0.1%

    let config = await factory.getFeeConfiguration();
    assert(config[0] == feeTo, 'unexpected feTo');
    Helper.assertEqual(config[1], new BN(10000));
  });

  it('set feeToSetter', async () => {
    let newFeeToSetter = accounts[3];
    await expectRevert(factory.setFeeToSetter(newFeeToSetter), 'only fee setter');

    await factory.setFeeToSetter(newFeeToSetter, {from: feeToSetter});
    feeToSetter = newFeeToSetter

    assert((await factory.feeToSetter()) == newFeeToSetter, 'unexpected feeToSetter');
  });

  it('enable a new fee option', async () => {
    let newFeeOption = 15000; // 0.15%
    await expectRevert(factory.enableFeeOption(new BN(10000)), 'only fee setter');
    await expectRevert(factory.enableFeeOption(new BN(0), {from: feeToSetter}), 'KS: INVALID FEE');
    
    await factory.enableFeeOption(newFeeOption, {from: feeToSetter});

    assert((await factory.feeOptions(newFeeOption)) == true, 'fee option is not asserted');
  });

  it('disableFeeOption a fee option', async () => {
    let feeOption = 15000; // 0.15%
    await expectRevert(factory.disableFeeOption(new BN(10000)), 'only fee setter');
    await expectRevert(factory.disableFeeOption(new BN(0), {from: feeToSetter}), 'KS: INVALID FEE');
    
    await factory.disableFeeOption(feeOption, {from: feeToSetter});

    assert((await factory.feeOptions(feeOption)) == false, 'fee option is not asserted');
  });
});
