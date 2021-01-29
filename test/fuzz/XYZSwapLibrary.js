const XYZSwapFactory = artifacts.require('XYZSwapFactory');
const MockXYZSwapPair = artifacts.require('MockXYZSwapPair');
const XYZSwapPair = artifacts.require('XYZSwapPair');

const XYZSwapLibrary = artifacts.require('MockXYZSwapLibrary');
const TestToken = artifacts.require('TestToken');

const BN = web3.utils.BN;
const {expectRevert, constants} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const Helper = require('../helper');

let factory;
let library;
let token0;
let token1;
let pair;

contract('XYZSwapLibrary', function (accounts) {
  beforeEach('set up', async function () {
    library = await XYZSwapLibrary.new();
    [factory, token0, token1, pair] = await setupPair(accounts[0], library, false);
    liquidityProvider = accounts[1];
  });

  it('sortToken', async () => {
    await factory.createPair(token0.address, token1.address, new BN(20000));
    const pairAddresses = await factory.getPairs(token0.address, token1.address);
    const pair = await XYZSwapPair.at(pairAddresses[0]);
    expect(await pair.token0(), token0.address);

    await expectRevert(library.sortTokens(token0.address, token0.address), 'XYZSwapLibrary: IDENTICAL_ADDRESSES');
    await expectRevert(library.sortTokens(token0.address, constants.ZERO_ADDRESS), 'XYZSwapLibrary: ZERO_ADDRESS');
  });

  const minReserve = new BN(10).pow(new BN(10));
  const maxReserve = new BN(10).pow(new BN(11));

  const minFee = Helper.precisionUnits.div(new BN(1000));
  const maxFee = Helper.precisionUnits.div(new BN(100));

  for (let index = 0; index < 10; index++) {
    it(`fuzz test getAmountOut index=${index}`, async function () {
      let reserve0 = genRandomBN(minReserve, maxReserve);
      let reserve1 = genRandomBN(minReserve, maxReserve);
      let fee = genRandomBN(minFee, maxFee);
      await addLiquidity(liquidityProvider, reserve0, reserve1);
      await pair.setFee(fee);

      let amountIn = genRandomBN(reserve0.div(new BN(20)), reserve0.div(new BN(10)));
      await token0.transfer(pair.address, amountIn);

      let amountOut = await library.getAmountOut(amountIn, reserve0, reserve1, reserve0, reserve1, fee);
      await expectRevert(pair.swap(0, amountOut.add(new BN(1)), accounts[0], '0x'), 'XYZSwap: K');
      await pair.swap(0, amountOut, accounts[0], '0x');
    });
  }

  for (let index = 0; index < 10; index++) {
    it(`fuzz test getAmountIn index=${index}`, async function () {
      let reserve0 = genRandomBN(minReserve, maxReserve);
      let reserve1 = genRandomBN(minReserve, maxReserve);
      let fee = genRandomBN(minFee, maxFee);
      await addLiquidity(liquidityProvider, reserve0, reserve1);
      await pair.setFee(fee);

      let amountOut = genRandomBN(reserve0.div(new BN(20)), reserve0.div(new BN(10)));
      let amountIn = await library.getAmountIn(amountOut, reserve0, reserve1, reserve0, reserve1, fee);
      await token0.transfer(pair.address, amountIn.sub(new BN(1)));
      await expectRevert(pair.swap(0, amountOut, accounts[0], '0x'), 'XYZSwap: K');
      await token0.transfer(pair.address, new BN(1));
      await pair.swap(0, amountOut, accounts[0], '0x');
    });
  }
});

function genRandomSeed (base) {
  return Math.floor(Math.random() * base) % base;
}

function genRandomBN (minBN, maxBN) {
  let seed = new BN(genRandomSeed(1000000000000000));
  // normalise seed
  return maxBN
    .sub(minBN)
    .mul(seed)
    .div(new BN(1000000000000000))
    .add(minBN);
}

async function setupPair (admin, library, isAmpPool) {
  let factory = await XYZSwapFactory.new(admin);
  let tokenA = await TestToken.new('test token A', 'A', Helper.expandTo18Decimals(10000));
  let tokenB = await TestToken.new('test token B', 'B', Helper.expandTo18Decimals(10000));

  let result = await library.sortTokens(tokenA.address, tokenB.address);
  const token0 = tokenA.address === result.token0 ? tokenA : tokenB;
  const token1 = tokenA.address === result.token0 ? tokenB : tokenA;

  const pair = await MockXYZSwapPair.new(factory.address, token0.address, token1.address, isAmpPool);
  return [factory, token0, token1, pair];
}

async function addLiquidity (liquidityProvider, token0Amount, token1Amount) {
  await token0.transfer(pair.address, token0Amount);
  await token1.transfer(pair.address, token1Amount);
  await pair.mint(liquidityProvider);
}
