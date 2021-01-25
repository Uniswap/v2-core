const TestToken = artifacts.require('TestToken');
const XYZSwapFactory = artifacts.require('XYZSwapFactory');
const XYZSwapPair = artifacts.require('XYZSwapPair');

const Helper = require('./helper');

const {expectRevert, constants} = require('@openzeppelin/test-helpers');
const {assert} = require('chai');
const BN = web3.utils.BN;

let tokenA;
let tokenB;
let factory;
let feeToSetter;
let feeTo;

contract('XYZSwapFactory', function (accounts) {
  before('init', async () => {
    feeToSetter = accounts[1];
    feeTo = accounts[2];
    factory = await XYZSwapFactory.new(feeToSetter);

    tokenA = await TestToken.new('test token A', 'A', Helper.expandTo18Decimals(10000));
    tokenB = await TestToken.new('test token B', 'B', Helper.expandTo18Decimals(10000));
  });

  it('create pair', async () => {
    const nonAmpBps = new BN(10000);
    const ampBps = new BN(20000);
    await expectRevert(factory.createPair(tokenA.address, constants.ZERO_ADDRESS, nonAmpBps), 'XYZSwap: ZERO_ADDRESS');

    await expectRevert(factory.createPair(tokenA.address, tokenA.address, nonAmpBps), 'XYZSwap: IDENTICAL_ADDRESSES');

    await expectRevert(factory.createPair(tokenA.address, tokenB.address, new BN(9999)), 'XYZSwap: INVALID_BPS');
    /// create pair nonAmp
    await factory.createPair(tokenA.address, tokenB.address, nonAmpBps);
    await expectRevert(factory.createPair(tokenA.address, tokenB.address, nonAmpBps), 'XYZSwap: PAIR_EXISTS');
    Helper.assertEqual(await factory.allPairsLength(), 1);

    /// create pair amp
    await factory.createPair(tokenA.address, tokenB.address, ampBps);
    Helper.assertEqual(await factory.allPairsLength(), 2);
    Helper.assertEqual(await factory.getPairsLength(tokenA.address, tokenB.address), 2);

    let pair0 = await factory.getPairAtIndex(tokenA.address, tokenB.address, new BN(0));
    assert(await factory.isPair(tokenA.address, tokenB.address, pair0), 'pair is not asserted');
  });

  it('set FeeTo', async () => {
    await expectRevert(factory.setFeeTo(feeTo), 'XYZSwap: FORBIDDEN');
    await factory.setFeeTo(feeTo, {from: feeToSetter});
  });

  it('set feeToSetter', async () => {
    let newFeeToSetter = accounts[3];
    await expectRevert(factory.setFeeToSetter(newFeeToSetter), 'XYZSwap: FORBIDDEN');
    await factory.setFeeToSetter(newFeeToSetter, {from: feeToSetter});

    assert((await factory.feeToSetter()) == newFeeToSetter, 'unexpected feeToSetter');
  });
});
