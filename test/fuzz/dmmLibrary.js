const DMMFactory = artifacts.require('DMMFactory');
const MockDMMPool = artifacts.require('MockDMMPool');
const DMMPool = artifacts.require('DMMPool');

const DMMLibrary = artifacts.require('MockDMMLibrary');
const TestToken = artifacts.require('TestToken');

const BN = web3.utils.BN;
const {expectRevert, constants} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const Helper = require('../helper');

let factory;
let library;
let token0;
let token1;
let pool;

contract('DMMLibrary', function (accounts) {
  beforeEach('set up', async function () {
    library = await DMMLibrary.new();
    [factory, token0, token1, pool] = await setupPool(accounts[0], library, false);
    liquidityProvider = accounts[1];
  });

  it('sortToken', async () => {
    await factory.createPool(token0.address, token1.address, new BN(20000));
    const poolAddresses = await factory.getPools(token0.address, token1.address);
    const pool = await DMMPool.at(poolAddresses[0]);
    expect(await pool.token0(), token0.address);

    await expectRevert(library.sortTokens(token0.address, token0.address), 'DMMLibrary: IDENTICAL_ADDRESSES');
    await expectRevert(library.sortTokens(token0.address, constants.ZERO_ADDRESS), 'DMMLibrary: ZERO_ADDRESS');
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
      await pool.setFee(fee);

      let amountIn = genRandomBN(reserve0.div(new BN(20)), reserve0.div(new BN(10)));
      await token0.transfer(pool.address, amountIn);

      let amountOut = await library.getAmountOut(amountIn, reserve0, reserve1, reserve0, reserve1, fee);
      await expectRevert(pool.swap(0, amountOut.add(new BN(1)), accounts[0], '0x'), 'DMM: K');
      await pool.swap(0, amountOut, accounts[0], '0x');
    });
  }

  for (let index = 0; index < 10; index++) {
    it(`fuzz test getAmountIn index=${index}`, async function () {
      let reserve0 = genRandomBN(minReserve, maxReserve);
      let reserve1 = genRandomBN(minReserve, maxReserve);
      let fee = genRandomBN(minFee, maxFee);
      await addLiquidity(liquidityProvider, reserve0, reserve1);
      await pool.setFee(fee);

      let amountOut = genRandomBN(reserve0.div(new BN(20)), reserve0.div(new BN(10)));
      let amountIn = await library.getAmountIn(amountOut, reserve0, reserve1, reserve0, reserve1, fee);
      await token0.transfer(pool.address, amountIn.sub(new BN(1)));
      await expectRevert(pool.swap(0, amountOut, accounts[0], '0x'), 'DMM: K');
      await token0.transfer(pool.address, new BN(1));
      await pool.swap(0, amountOut, accounts[0], '0x');
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

async function setupPool (admin, library, isAmpPool) {
  let factory = await DMMFactory.new(admin);
  let tokenA = await TestToken.new('test token A', 'A', Helper.expandTo18Decimals(10000));
  let tokenB = await TestToken.new('test token B', 'B', Helper.expandTo18Decimals(10000));

  let result = await library.sortTokens(tokenA.address, tokenB.address);
  const token0 = tokenA.address === result.token0 ? tokenA : tokenB;
  const token1 = tokenA.address === result.token0 ? tokenB : tokenA;

  const pool = await MockDMMPool.new(factory.address, token0.address, token1.address, isAmpPool);
  return [factory, token0, token1, pool];
}

async function addLiquidity (liquidityProvider, token0Amount, token1Amount) {
  await token0.transfer(pool.address, token0Amount);
  await token1.transfer(pool.address, token1Amount);
  await pool.mint(liquidityProvider);
}
