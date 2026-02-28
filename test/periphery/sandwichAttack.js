const Helper = require('../helper');
const dmmHelper = require('../dmmHelper');
const BN = web3.utils.BN;

const {precisionUnits, MINIMUM_LIQUIDITY} = require('../helper');
const {expectEvent, expectRevert, time} = require('@openzeppelin/test-helpers');
const {ecsign} = require('ethereumjs-util');

const DMMRouter = artifacts.require('DMMRouter02');
const DMMFactory = artifacts.require('DMMFactory');
const DMMPool = artifacts.require('DMMPool');
const WETH = artifacts.require('WETH9');
const TestToken = artifacts.require('TestToken');

contract('test', async accounts => {
  it.skip('sandwich attacks', async () => {
    const deployer = accounts[0];
    const attacker = accounts[1];
    const victim = accounts[2];

    const ampBps = new BN(100000); // 10

    const factory = await DMMFactory.new(deployer);
    const weth = await WETH.new();
    const router = await DMMRouter.new(factory.address, weth.address);

    let tokenA = await TestToken.new('TokenX', 'TX', new BN(100000000).mul(Helper.precisionUnits));
    let tokenB = await TestToken.new('TokenY', 'TY', new BN(100000000).mul(Helper.precisionUnits));
    let [token0, token1] = new BN(tokenA.address).lt(new BN(tokenB.address)) ? [tokenA, tokenB] : [tokenB, tokenA];

    // assume 1 token0 is equals 100 token1
    const priceRatio = new BN(100);

    const token0Amount = new BN(100).mul(Helper.precisionUnits);
    const token1Amount = new BN(10000).mul(Helper.precisionUnits);

    await token0.transfer(victim, token0Amount);
    await token1.transfer(victim, token1Amount);
    await token0.transfer(attacker, token0Amount);
    await token1.transfer(attacker, token1Amount);

    console.log('setup');
    let initVictim = await printBalance('victim', victim, token0, token1);
    let initAttacker = await printBalance('attacker', attacker, token0, token1);

    await factory.createPool(token0.address, token1.address, ampBps, {from: deployer});
    const poolAddrs = await factory.getPools(token0.address, token1.address);
    let pool = await DMMPool.at(poolAddrs[0]);

    // Allowances
    await token0.approve(router.address, Helper.MaxUint256, {from: attacker});
    await token1.approve(router.address, Helper.MaxUint256, {from: attacker});
    await token0.approve(router.address, Helper.MaxUint256, {from: victim});
    await token1.approve(router.address, Helper.MaxUint256, {from: victim});
    await pool.approve(router.address, Helper.MaxUint256, {from: attacker});
    await pool.approve(router.address, Helper.MaxUint256, {from: victim});

    await router.addLiquidity(
      token0.address,
      token1.address,
      pool.address,
      token0Amount.div(new BN(100)),
      token1Amount.div(new BN(100)),
      Helper.zeroBN,
      Helper.zeroBN,
      [Helper.zeroBN, Helper.MaxUint256],
      attacker,
      Helper.MaxUint256,
      {from: attacker}
    );

    console.log('After added liquidity:');
    await printPoolInfo('Pool', pool, token0, token1);
    console.log(`[+] Attacker LP Balance: ${convertWeiToFloat(await pool.balanceOf(attacker))}`);

    console.log('Attack begins - T1');
    let amountOut = (await token0.balanceOf(pool.address)).sub(new BN(1000));
    await router.swapTokensForExactTokens(
      amountOut,
      Helper.MaxUint256,
      [pool.address],
      [token1.address, token0.address],
      attacker,
      Helper.MaxUint256,
      {from: attacker}
    );
    await printPoolInfo('Pool after swap', pool, token0, token1);

    console.log('Adding unbalanced liqudity');
    let redundantAmount = (await token1.balanceOf(pool.address))
      .div(priceRatio)
      .sub(await token0.balanceOf(pool.address));
    await token0.transfer(pool.address, redundantAmount, {from: attacker});
    await token1.transfer(pool.address, new BN(1000), {from: attacker});
    await pool.mint(attacker, {from: attacker});
    await printPoolInfo('Pool after unbalanced liquidity', pool, token0, token1);

    console.log('Victim adds liquidity - T2');
    await expectRevert(
      router.addLiquidity(
        token0.address,
        token1.address,
        pool.address,
        token0Amount,
        token1Amount,
        token0Amount.div(new BN(100)).mul(new BN(99)),
        token1Amount.div(new BN(100)).mul(new BN(99)),
        [
          token1Amount
            .mul(Helper.Q112)
            .mul(new BN(99))
            .div(new BN(100))
            .div(token0Amount),
          token1Amount
            .mul(Helper.Q112)
            .mul(new BN(100))
            .div(new BN(99))
            .div(token0Amount)
        ],
        victim,
        Helper.MaxUint256,
        {from: victim}
      ),
      'DMMRouter: OUT_OF_BOUNDS_VRESERVE'
    );
    /*
    await printPoolInfo('Pool with victim liquidity', pool, token0, token1);
    console.log(`[+] Victim LP Balance: ${convertWeiToFloat(await pool.balanceOf(victim))}`);

    console.log('Attack continues - T3');
    await router.removeLiquidity(
      token0.address,
      token1.address,
      pool.address,
      await pool.balanceOf(attacker),
      Helper.zeroBN,
      Helper.zeroBN,
      attacker,
      Helper.MaxUint256,
      {from: attacker}
    );
    await printPoolInfo('Pool without attacker liquidity', pool, token0, token1);

    let {newVR0, newVR1, oldVR0, oldVR1} = await computeBalanceReserve(pool);
    await router.swapTokensForExactTokens(
      oldVR1.sub(newVR1),
      Helper.MaxUint256,
      [pool.address],
      [token0.address, token1.address],
      attacker,
      Helper.MaxUint256,
      {from: attacker}
    );

    await printPoolInfo('Pool after final swap', pool, token0, token1);
    await printBalance('Attacker', attacker, token0, token1);
    */
  });

  function convertWeiToFloat (a) {
    return a.div(new BN(10).pow(new BN(16))).toNumber() / 100;
  }

  async function printBalance (name, user, token0, token1) {
    const b0 = await token0.balanceOf(user);
    const b1 = await token1.balanceOf(user);
    console.log(`[+] Balance of ${name}:`);
    console.log(`[++] Token0: ${convertWeiToFloat(b0)}`);
    console.log(`[++] Token1: ${convertWeiToFloat(b1)}`);

    let value = convertWeiToFloat(b0.mul(new BN(100)).add(b1));
    console.log(`[++] Value: ${value} USD`);
    return value;
  }

  async function computeBalanceReserve (pool) {
    let tradeInfo = await pool.getTradeInfo();
    prod = tradeInfo[2].mul(tradeInfo[3]);

    let newVR0 = Helper.sqrt(prod.div(new BN(100)));
    let newVR1 = Helper.sqrt(prod.mul(new BN(100)));
    return {newVR0, newVR1, oldVR0: tradeInfo[2], oldVR1: tradeInfo[3]};
  }

  async function printPoolInfo (name, pool, token0, token1) {
    let poolValue = await printBalance(name, pool.address, token0, token1);

    console.log(`[+] Value of 1 LP Share: ${poolValue / convertWeiToFloat(await pool.totalSupply())} USD`);
    let tradeInfo = await pool.getTradeInfo();
    console.log(`[+] Virtual Reserves: ${convertWeiToFloat(tradeInfo[2])}, ${convertWeiToFloat(tradeInfo[3])}`);
    return poolValue;
  }
});
