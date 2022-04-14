const TestToken = artifacts.require('TestToken');
const DMMFactory = artifacts.require('DMMFactory');
const DMMPool = artifacts.require('DMMPool');

const {expectEvent, expectRevert, constants} = require('@openzeppelin/test-helpers');
const {assert} = require('chai');
const BN = web3.utils.BN;

const Helper = require('./helper');
const dmmHelper = require('./dmmHelper');
const {expandTo18Decimals, precisionUnits} = require('./helper');

const MINIMUM_LIQUIDITY = new BN(1000);

let token0;
let token1;
let factory;
let pool;
let trader;
let feeTo;
let liquidityProvider;
let app;

let ampBps = new BN(20000);
let unamplifiedBps = new BN(10000);

let baseRate = new BN(0);

contract('DMMPool', function (accounts) {
  before('setup', async () => {
    admin = accounts[0];
    trader = accounts[1];
    app = accounts[2];
    liquidityProvider = accounts[3];
    feeTo = accounts[4];
    let tokenA = await TestToken.new('test token A', 'A', Helper.MaxUint256);
    let tokenB = await TestToken.new('test token B', 'B', Helper.MaxUint256);
    [token0, token1] = new BN(tokenA.address).lt(new BN(tokenB.address)) ? [tokenA, tokenB] : [tokenB, tokenA];
  });

  it('name & symbol', async () => {
    [factory, pool] = await setupPool(admin, token0, token1, unamplifiedBps);
    assert(await pool.symbol(), `DMM-LP ${await token0.symbol()} ${await token1.symbol()}`, 'unexpected symbol');
    assert(await pool.name(), `KyberDMM LP ${await token0.symbol()} ${await token1.symbol()}`, 'unexpected name');
  });

  it('can not initialize not by factory', async () => {
    [factory, pool] = await setupPool(admin, token0, token1, unamplifiedBps);
    await expectRevert(pool.initialize(token0.address, token1.address, unamplifiedBps), 'DMM: FORBIDDEN');
  });

  describe('mint', async () => {
    it('unamplified pool', async () => {
      const token0Amount = Helper.expandTo18Decimals(1);
      const token1Amount = Helper.expandTo18Decimals(4);
      [factory, pool] = await setupPool(admin, token0, token1, unamplifiedBps);
      await token0.transfer(pool.address, token0Amount);
      await token1.transfer(pool.address, token1Amount);

      const expectedLiquidity = Helper.expandTo18Decimals(2);
      let result = await pool.mint(trader, {from: app});

      expectEvent(result, 'Mint', {sender: app, amount0: token0Amount, amount1: token1Amount});
      expectEvent(result, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: trader,
        value: expectedLiquidity.sub(MINIMUM_LIQUIDITY)
      });
      expectEvent(result, 'Sync', {reserve0: token0Amount, reserve1: token1Amount});

      Helper.assertEqual(await pool.totalSupply(), expectedLiquidity, 'unexpected totalSupply');
      Helper.assertEqual(await pool.balanceOf(trader), expectedLiquidity.sub(MINIMUM_LIQUIDITY));

      Helper.assertEqual(await token0.balanceOf(pool.address), token0Amount);
      Helper.assertEqual(await token1.balanceOf(pool.address), token1Amount);

      const reserves = await pool.getReserves();
      Helper.assertEqual(reserves._reserve0, token0Amount);
      Helper.assertEqual(reserves._reserve1, token1Amount);

      const updateToken0Amount = Helper.expandTo18Decimals(2);
      const updateToken1Amount = Helper.expandTo18Decimals(2);
      await token0.transfer(pool.address, updateToken0Amount);
      // if transfer only 1 token, trade will revert
      await expectRevert(pool.mint(trader, {from: app}), 'DMM: INSUFFICIENT_LIQUIDITY_MINTED');

      await token1.transfer(pool.address, updateToken1Amount);
      result = await pool.mint(trader, {from: app});
      // the amount mint will be the min ratio with reserve0 and reserve1
      expectEvent(result, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: trader,
        value: expectedLiquidity.div(new BN(2))
      });
      Helper.assertEqual(
        await pool.balanceOf(trader),
        expectedLiquidity.sub(MINIMUM_LIQUIDITY).add(expectedLiquidity.div(new BN(2)))
      );
    });

    it('amp pool', async () => {
      ampBps = new BN(20000);
      const token0Amount = Helper.expandTo18Decimals(1);
      const token1Amount = Helper.expandTo18Decimals(4);
      [factory, pool] = await setupPool(admin, token0, token1, ampBps);
      await token0.transfer(pool.address, token0Amount);
      await token1.transfer(pool.address, token1Amount);

      const expectedLiquidity = Helper.expandTo18Decimals(2);
      let result = await pool.mint(trader, {from: app});

      expectEvent(result, 'Mint', {sender: app, amount0: token0Amount, amount1: token1Amount});
      expectEvent(result, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: trader,
        value: expectedLiquidity.sub(MINIMUM_LIQUIDITY)
      });
      expectEvent(result, 'Sync', {
        reserve0: token0Amount,
        reserve1: token1Amount,
        vReserve0: token0Amount.mul(ampBps).div(Helper.BPS),
        vReserve1: token1Amount.mul(ampBps).div(Helper.BPS)
      });

      Helper.assertEqual(await pool.totalSupply(), expectedLiquidity, 'unexpected totalSupply');
      Helper.assertEqual(await pool.balanceOf(trader), expectedLiquidity.sub(MINIMUM_LIQUIDITY));

      Helper.assertEqual(await token0.balanceOf(pool.address), token0Amount);
      Helper.assertEqual(await token1.balanceOf(pool.address), token1Amount);

      const reserves = await pool.getReserves();
      Helper.assertEqual(reserves._reserve0, token0Amount);
      Helper.assertEqual(reserves._reserve1, token1Amount);

      const updateToken0Amount = Helper.expandTo18Decimals(2);
      const updateToken1Amount = Helper.expandTo18Decimals(2);
      await token0.transfer(pool.address, updateToken0Amount);
      // if transfer only 1 token, trade will revert
      await expectRevert(pool.mint(trader, {from: app}), 'DMM: INSUFFICIENT_LIQUIDITY_MINTED');

      await token1.transfer(pool.address, updateToken1Amount);
      result = await pool.mint(trader, {from: app});
      // the amount mint will be the min ratio with reserve0 and reserve1
      expectEvent(result, 'Transfer', {
        from: constants.ZERO_ADDRESS,
        to: trader,
        value: expectedLiquidity.div(new BN(2))
      });
      Helper.assertEqual(
        await pool.balanceOf(trader),
        expectedLiquidity.sub(MINIMUM_LIQUIDITY).add(expectedLiquidity.div(new BN(2)))
      );
    });
  });

  describe('swap', async () => {
    /// [swapAmount, token0Amount, token1Amount]
    const swapTestCases = [
      [1, 5, 10],
      [1, 10, 5],

      [2, 5, 10],
      [2, 10, 5],

      [1, 10, 10],
      [1, 100, 100],
      [1, 1000, 1000]
    ];

    swapTestCases.forEach((testCase, i) => {
      const [swapAmount, token0Amount, token1Amount] = testCase;
      it(`getInputPrice:${i} unamplified pool`, async () => {
        [factory, pool] = await setupPool(admin, token0, token1, unamplifiedBps);
        await addLiquidity(
          liquidityProvider,
          pool,
          expandTo18Decimals(token0Amount),
          expandTo18Decimals(token1Amount)
        );
        await token0.transfer(pool.address, expandTo18Decimals(swapAmount));
        let expectedOutputAmount = await dmmHelper.getAmountOut(expandTo18Decimals(swapAmount), token0, pool);
        await expectRevert(pool.swap(0, expectedOutputAmount.add(new BN(1)), trader, '0x'), 'DMM: K');
        await pool.swap(0, new BN(expectedOutputAmount), trader, '0x');
      });

      it(`getInputPrice:${i} amp pool`, async () => {
        [factory, pool] = await setupPool(admin, token0, token1, ampBps);
        await addLiquidity(
          liquidityProvider,
          pool,
          expandTo18Decimals(token0Amount),
          expandTo18Decimals(token1Amount)
        );
        await token0.transfer(pool.address, expandTo18Decimals(swapAmount));
        let amountOut = await dmmHelper.getAmountOut(expandTo18Decimals(swapAmount), token0, pool);
        await expectRevert(pool.swap(0, amountOut.add(new BN(1)), trader, '0x'), 'DMM: K');
        await pool.swap(0, new BN(amountOut), trader, '0x');
      });
    });

    it('swap:token0 amp pool', async () => {
      [factory, pool] = await setupPool(admin, token0, token1, ampBps);
      const token0Amount = expandTo18Decimals(5);
      const token1Amount = expandTo18Decimals(10);
      const swapAmount = expandTo18Decimals(1);

      await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);

      let amountOut = await dmmHelper.getAmountOut(swapAmount, token0.address, pool);
      // when amountIn = 0 -> revert
      await expectRevert(pool.swap(new BN(0), amountOut, trader, '0x', {from: app}), 'DMM: INSUFFICIENT_INPUT_AMOUNT');

      // when amountOut = 0 -> revert
      await token0.transfer(pool.address, swapAmount);
      await expectRevert(
        pool.swap(new BN(0), new BN(0), trader, '0x', {from: app}),
        'DMM: INSUFFICIENT_OUTPUT_AMOUNT'
      );
      // when amountOut > liquidity -> revert
      await expectRevert(
        pool.swap(new BN(0), token1Amount.add(new BN(1)), trader, '0x', {from: app}),
        'DMM: INSUFFICIENT_LIQUIDITY'
      );
      // revert when destAddres is token0 or token1
      await expectRevert(pool.swap(new BN(0), amountOut, token0.address, '0x', {from: app}), 'DMM: INVALID_TO');
      // normal swap if everything is valid
      await token1.transfer(trader, new BN(1));

      let beforeBalanceToken0 = await token0.balanceOf(trader);
      let beforeBalanceToken1 = await token1.balanceOf(trader);
      let txResult = await pool.swap(new BN(0), amountOut, trader, '0x', {from: app});

      expectEvent(txResult, 'Sync', {
        reserve0: token0Amount.add(swapAmount),
        reserve1: token1Amount.sub(amountOut)
      });

      expectEvent(txResult, 'Swap', {
        sender: app,
        amount0In: swapAmount,
        amount1In: new BN(0),
        amount0Out: new BN(0),
        amount1Out: amountOut,
        to: trader
      });

      Helper.assertEqual(await token0.balanceOf(pool.address), token0Amount.add(swapAmount));
      Helper.assertEqual(await token1.balanceOf(pool.address), token1Amount.sub(amountOut));
      // balance of token0 should be unchanged after transfer
      Helper.assertEqual(await token0.balanceOf(trader), beforeBalanceToken0);
      // balance of token1 should increase by amountOut
      Helper.assertEqual(await token1.balanceOf(trader), beforeBalanceToken1.add(amountOut));
      // this number of uniswap is 73462
      console.log(`amp pool swap gasUsed = ${txResult.receipt.gasUsed}`);
    });

    it('swap:token0 unamplified pool', async () => {
      [factory, pool] = await setupPool(admin, token0, token1, unamplifiedBps);
      const token0Amount = expandTo18Decimals(5);
      const token1Amount = expandTo18Decimals(10);
      const swapAmount = expandTo18Decimals(1);

      await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);

      let amountOut = await dmmHelper.getAmountOut(swapAmount, token0.address, pool);
      // when amountIn = 0 -> revert
      await expectRevert(pool.swap(new BN(0), amountOut, trader, '0x', {from: app}), 'DMM: INSUFFICIENT_INPUT_AMOUNT');

      // when amountOut = 0 -> revert
      await token0.transfer(pool.address, swapAmount);
      await expectRevert(
        pool.swap(new BN(0), new BN(0), trader, '0x', {from: app}),
        'DMM: INSUFFICIENT_OUTPUT_AMOUNT'
      );
      // when amountOut > liquidity -> revert
      await expectRevert(
        pool.swap(new BN(0), token1Amount.add(new BN(1)), trader, '0x', {from: app}),
        'DMM: INSUFFICIENT_LIQUIDITY'
      );
      // revert when destAddres is token0 or token1
      await expectRevert(pool.swap(new BN(0), amountOut, token0.address, '0x', {from: app}), 'DMM: INVALID_TO');
      // normal swap if everything is valid
      await token1.transfer(trader, new BN(1));

      let beforeBalanceToken0 = await token0.balanceOf(trader);
      let beforeBalanceToken1 = await token1.balanceOf(trader);
      let txResult = await pool.swap(new BN(0), amountOut, trader, '0x', {from: app});

      expectEvent(txResult, 'Sync', {
        reserve0: token0Amount.add(swapAmount),
        reserve1: token1Amount.sub(amountOut),
        vReserve0: new BN(0),
        vReserve1: new BN(0)
      });

      expectEvent(txResult, 'Swap', {
        sender: app,
        amount0In: swapAmount,
        amount1In: new BN(0),
        amount0Out: new BN(0),
        amount1Out: amountOut,
        to: trader
      });

      const tradeInfo = await pool.getTradeInfo();
      Helper.assertEqual(await token0.balanceOf(pool.address), token0Amount.add(swapAmount));
      Helper.assertEqual(await token1.balanceOf(pool.address), token1Amount.sub(amountOut));
      // balance of token0 should be unchanged after transfer
      Helper.assertEqual(await token0.balanceOf(trader), beforeBalanceToken0);
      // balance of token1 should increase by amountOut
      Helper.assertEqual(await token1.balanceOf(trader), beforeBalanceToken1.add(amountOut));
      // this number of uniswap is 73462
      console.log(`unamplified pool swap gasUsed = ${txResult.receipt.gasUsed}`);
    });

    [20000, 50000, 200000, 1000000].forEach(ampBPS => {
      it(`swap: token0 stable pool ampBPS = ${ampBPS}`, async () => {
        [factory, pool] = await setupPool(admin, token0, token1, new BN(ampBPS));
        const token0Amount = expandTo18Decimals(10);
        const token1Amount = expandTo18Decimals(10);
        const swapAmount = expandTo18Decimals(1);

        await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);
        let tradeInfo = await pool.getTradeInfo();
        console.log(`fee = ${tradeInfo.feeInPrecision.toString()}`);

        let amountOut = await dmmHelper.getAmountOut(swapAmount, token0, pool);

        let beforeBalanceToken0 = await token0.balanceOf(trader);
        let beforeBalanceToken1 = await token1.balanceOf(trader);
        await token0.transfer(pool.address, swapAmount);

        await expectRevert(pool.swap(new BN(0), amountOut.add(new BN(1)), trader, '0x', {from: app}), 'DMM: K');

        let result = await pool.swap(new BN(0), amountOut, trader, '0x', {from: app});
        console.log(`stable pool gasUsed = ${result.receipt.gasUsed}`);

        await assertTokenPoolBalances(token0, token1, pool.address, [
          token0Amount.add(swapAmount),
          token1Amount.sub(amountOut)
        ]);

        await assertTokenPoolBalances(token0, token1, trader, [
          beforeBalanceToken0,
          beforeBalanceToken1.add(amountOut)
        ]);
      });

      it(`swap: token1 stable pool ampBPS = ${ampBPS}`, async () => {
        [factory, pool] = await setupPool(admin, token0, token1, new BN(ampBPS));
        const token0Amount = expandTo18Decimals(10);
        const token1Amount = expandTo18Decimals(10);
        const swapAmount = expandTo18Decimals(1);

        await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);

        let tradeInfo = await pool.getTradeInfo();
        console.log(`fee = ${tradeInfo.feeInPrecision.toString()}`);
        let amountOut = await dmmHelper.getAmountOut(swapAmount, token1, pool);

        let beforeBalanceToken0 = await token0.balanceOf(trader);
        let beforeBalanceToken1 = await token1.balanceOf(trader);
        await token1.transfer(pool.address, swapAmount);

        await expectRevert(pool.swap(amountOut.add(new BN(1)), new BN(0), trader, '0x', {from: app}), 'DMM: K');

        let result = await pool.swap(amountOut, new BN(0), trader, '0x', {from: app});
        console.log(`stable pool gasUsed = ${result.receipt.gasUsed}`);

        await assertTokenPoolBalances(token0, token1, pool.address, [
          token0Amount.sub(amountOut),
          token1Amount.add(swapAmount)
        ]);

        await assertTokenPoolBalances(token0, token1, trader, [
          beforeBalanceToken0.add(amountOut),
          beforeBalanceToken1
        ]);
      });
    });

    it('swap:token1 amp pool', async () => {
      [factory, pool] = await setupPool(admin, token0, token1, ampBps);
      const token0Amount = expandTo18Decimals(5);
      const token1Amount = expandTo18Decimals(10);
      await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);

      const swapAmount = expandTo18Decimals(1);
      let amountOut = await dmmHelper.getAmountOut(swapAmount, token1, pool);
      await token1.transfer(pool.address, swapAmount);

      let beforeBalanceToken0 = await token0.balanceOf(trader);
      let beforeBalanceToken1 = await token1.balanceOf(trader);
      let result = await pool.swap(amountOut, new BN(0), trader, '0x', {from: app});

      expectEvent(result, 'Sync', {
        reserve0: token0Amount.sub(amountOut),
        reserve1: token1Amount.add(swapAmount)
      });

      expectEvent(result, 'Swap', {
        sender: app,
        amount0In: new BN(0),
        amount1In: swapAmount,
        amount0Out: amountOut,
        amount1Out: new BN(0),
        to: trader
      });

      Helper.assertEqual(await token0.balanceOf(pool.address), token0Amount.sub(amountOut));
      Helper.assertEqual(await token1.balanceOf(pool.address), token1Amount.add(swapAmount));
      // balance of token0 should increase by amountOut
      Helper.assertEqual(await token0.balanceOf(trader), beforeBalanceToken0.add(amountOut));
      // balance of token1 should be unchanged after transfer
      Helper.assertEqual(await token1.balanceOf(trader), beforeBalanceToken1);
    });

    it('swap:token1 unamplified pool', async () => {
      [factory, pool] = await setupPool(admin, token0, token1, unamplifiedBps, new BN(0));
      const token0Amount = expandTo18Decimals(5);
      const token1Amount = expandTo18Decimals(10);
      await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);

      const swapAmount = expandTo18Decimals(1);
      let amountOut = await dmmHelper.getAmountOut(swapAmount, token1, pool);
      await token1.transfer(pool.address, swapAmount);

      let beforeBalanceToken0 = await token0.balanceOf(trader);
      let beforeBalanceToken1 = await token1.balanceOf(trader);
      let result = await pool.swap(amountOut, new BN(0), trader, '0x', {from: app});

      expectEvent(result, 'Sync', {
        reserve0: token0Amount.sub(amountOut),
        reserve1: token1Amount.add(swapAmount),
        vReserve0: new BN(0),
        vReserve1: new BN(0)
      });

      expectEvent(result, 'Swap', {
        sender: app,
        amount0In: new BN(0),
        amount1In: swapAmount,
        amount0Out: amountOut,
        amount1Out: new BN(0),
        to: trader
      });

      Helper.assertEqual(await token0.balanceOf(pool.address), token0Amount.sub(amountOut));
      Helper.assertEqual(await token1.balanceOf(pool.address), token1Amount.add(swapAmount));
      // balance of token0 should increase by amountOut
      Helper.assertEqual(await token0.balanceOf(trader), beforeBalanceToken0.add(amountOut));
      // balance of token1 should be unchanged after transfer
      Helper.assertEqual(await token1.balanceOf(trader), beforeBalanceToken1);
    });

    const optimisticTestCases = [
      [new BN('997000000000000000'), expandTo18Decimals(5), expandTo18Decimals(10), expandTo18Decimals(1)], // given amountIn, amountOut = floor(amountIn * .997)
      [new BN('997000000000000000'), expandTo18Decimals(10), expandTo18Decimals(5), expandTo18Decimals(1)],
      [new BN('997000000000000000'), expandTo18Decimals(5), expandTo18Decimals(5), expandTo18Decimals(1)],
      [expandTo18Decimals(1), expandTo18Decimals(5), expandTo18Decimals(5), new BN('1003009027081243732')] // given amountOut, amountIn = ceiling(amountOut / .997)
    ];
    optimisticTestCases.forEach((testCase, i) => {
      it(`optimistic:${i}`, async () => {
        const [, token0Amount, token1Amount, inputAmount] = testCase;
        await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);
        await token0.transfer(pool.address, inputAmount);

        let result = await pool.getTradeInfo();

        let outputAmount = inputAmount.mul(precisionUnits.sub(result.feeInPrecision)).div(precisionUnits);
        await expectRevert(pool.swap(outputAmount.add(new BN(1)), 0, trader, '0x'), 'DMM: K');
        await pool.swap(outputAmount, 0, trader, '0x');
      });
    });
  });

  describe('burn', async () => {
    it('burn unamplified pool', async () => {
      [factory, pool] = await setupPool(admin, token0, token1, unamplifiedBps);
      const token0Amount = expandTo18Decimals(3);
      const token1Amount = expandTo18Decimals(3);
      await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);

      // revert if liquidity burn is 0
      await expectRevert(pool.burn(liquidityProvider, {from: app}), 'DMM: INSUFFICIENT_LIQUIDITY_BURNED');

      const expectedLiquidity = expandTo18Decimals(3);
      let beforeBalances = await getTokenPoolBalances(token0, token1, liquidityProvider);

      await pool.transfer(pool.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY), {from: liquidityProvider});
      let result = await pool.burn(liquidityProvider, {from: app});

      expectEvent(result, 'Transfer', {
        from: pool.address,
        to: constants.ZERO_ADDRESS,
        value: expectedLiquidity.sub(MINIMUM_LIQUIDITY)
      });

      expectEvent(result, 'Burn', {
        sender: app,
        amount0: token0Amount.sub(new BN(1000)),
        amount1: token1Amount.sub(new BN(1000))
      });

      expectEvent(result, 'Sync', {
        reserve0: new BN(1000),
        reserve1: new BN(1000)
      });

      Helper.assertEqual(await pool.balanceOf(liquidityProvider), new BN(0));
      Helper.assertEqual(await pool.totalSupply(), MINIMUM_LIQUIDITY);
      // assert balances of user and pool
      await assertTokenPoolBalances(token0, token1, pool.address, [MINIMUM_LIQUIDITY, MINIMUM_LIQUIDITY]);
      await assertTokenPoolBalances(token0, token1, liquidityProvider, [
        beforeBalances[0].add(token0Amount.sub(MINIMUM_LIQUIDITY)),
        beforeBalances[1].add(token1Amount.sub(MINIMUM_LIQUIDITY))
      ]);
      console.log(`burn gas used ${result.receipt.gasUsed}`);
    });

    it('burn amp pool', async () => {
      [factory, pool] = await setupPool(admin, token0, token1, ampBps);
      const token0Amount = expandTo18Decimals(1);
      const token1Amount = expandTo18Decimals(4);
      await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);

      // revert if liquidity burn is 0
      await expectRevert(pool.burn(liquidityProvider, {from: app}), 'DMM: INSUFFICIENT_LIQUIDITY_BURNED');

      const expectedLiquidity = expandTo18Decimals(2);
      let beforeBalances = await getTokenPoolBalances(token0, token1, liquidityProvider);

      await pool.transfer(pool.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY), {from: liquidityProvider});
      let result = await pool.burn(liquidityProvider, {from: app});

      expectEvent(result, 'Transfer', {
        from: pool.address,
        to: constants.ZERO_ADDRESS,
        value: expectedLiquidity.sub(MINIMUM_LIQUIDITY)
      });

      expectEvent(result, 'Burn', {
        sender: app,
        amount0: token0Amount.sub(new BN(500)),
        amount1: token1Amount.sub(new BN(2000))
      });

      expectEvent(result, 'Sync', {
        reserve0: new BN(500),
        reserve1: new BN(2000),
        vReserve0: new BN(500).mul(ampBps).div(Helper.BPS),
        vReserve1: new BN(2000).mul(ampBps).div(Helper.BPS)
      });

      Helper.assertEqual(await pool.balanceOf(liquidityProvider), new BN(0));
      Helper.assertEqual(await pool.totalSupply(), MINIMUM_LIQUIDITY);
      // assert balances of user and pool
      await assertTokenPoolBalances(token0, token1, pool.address, [new BN(500), new BN(2000)]);
      await assertTokenPoolBalances(token0, token1, liquidityProvider, [
        beforeBalances[0].add(token0Amount.sub(new BN(500))),
        beforeBalances[1].add(token1Amount.sub(new BN(2000)))
      ]);
      console.log(`burn gas used ${result.receipt.gasUsed}`);
    });
  });

  describe('fee', async () => {
    it('feeTo:on unamplified pool', async () => {
      const token0Amount = expandTo18Decimals(1000);
      const token1Amount = expandTo18Decimals(1000);
      const governmentFeeBps = new BN(1000);

      [factory, pool] = await setupPool(admin, token0, token1, unamplifiedBps);
      await factory.setFeeConfiguration(feeTo, governmentFeeBps, {from: accounts[0]});
      await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);
      let totalSuppy = await pool.totalSupply();

      const kLast = token1Amount.mul(token0Amount);
      Helper.assertEqual(await pool.kLast(), token1Amount.mul(token0Amount));

      const swapAmount = expandTo18Decimals(1);
      let tradeInfo = await pool.getTradeInfo();
      let amountOut = await dmmHelper.getAmountOut(swapAmount, token1, pool);
      await token1.transfer(pool.address, swapAmount);
      await pool.swap(amountOut, 0, trader, '0x');

      const expectedLiquidity = expandTo18Decimals(1000);
      await pool.transfer(pool.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY), {from: liquidityProvider});
      await pool.burn(liquidityProvider);

      const k = token1Amount.add(swapAmount).mul(token0Amount.sub(amountOut));
      let fee = await dmmHelper.getFee(totalSuppy, k, kLast, governmentFeeBps);

      Helper.assertEqual(await pool.totalSupply(), MINIMUM_LIQUIDITY.add(fee));
      Helper.assertEqual(await pool.balanceOf(feeTo), fee);

      // add liquidity will not be charged fee
      await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);
      Helper.assertEqual(await pool.balanceOf(feeTo), fee);

      // disable fee again
      await factory.setFeeConfiguration(constants.ZERO_ADDRESS, governmentFeeBps, {from: accounts[0]});
      await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);

      tradeInfo = await pool.getTradeInfo();
      amountOut = await dmmHelper.getAmountOut(swapAmount, token1, pool);
      await token1.transfer(pool.address, swapAmount);
      await pool.swap(amountOut, 0, trader, '0x');

      await pool.sync();
      Helper.assertEqual(await pool.balanceOf(feeTo), fee);
      Helper.assertEqual(await pool.kLast(), new BN(0));
    });

    it('feeTo:on amp pool', async () => {
      const token0Amount = expandTo18Decimals(1000);
      const token1Amount = expandTo18Decimals(1000);
      const vToken0Amount = token0Amount.mul(ampBps).div(Helper.BPS);
      const vToken1Amount = token1Amount.mul(ampBps).div(Helper.BPS);
      const governmentFeeBps = new BN(1000);

      [factory, pool] = await setupPool(admin, token0, token1, ampBps);
      await factory.setFeeConfiguration(feeTo, governmentFeeBps, {from: accounts[0]});
      await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);
      let totalSuppy = await pool.totalSupply();

      const kLast = vToken0Amount.mul(vToken1Amount);
      Helper.assertEqual(await pool.kLast(), kLast);

      const swapAmount = expandTo18Decimals(1);
      let tradeInfo = await pool.getTradeInfo();
      let amountOut = await dmmHelper.getAmountOut(swapAmount, token1, pool);
      await token1.transfer(pool.address, swapAmount);
      await pool.swap(amountOut, 0, trader, '0x');

      const expectedLiquidity = expandTo18Decimals(1000);
      await pool.transfer(pool.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY), {from: liquidityProvider});
      await pool.burn(liquidityProvider);

      const k = vToken1Amount.add(swapAmount).mul(vToken0Amount.sub(amountOut));
      let fee = dmmHelper.getFee(totalSuppy, k, kLast, governmentFeeBps);

      Helper.assertEqual(await pool.totalSupply(), MINIMUM_LIQUIDITY.add(fee));
      Helper.assertEqual(await pool.balanceOf(feeTo), fee);

      // add liquidity will not be charged fee
      await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);
      Helper.assertEqual(await pool.balanceOf(feeTo), fee);

      // disable fee again
      await factory.setFeeConfiguration(constants.ZERO_ADDRESS, governmentFeeBps, {from: accounts[0]});
      await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);

      tradeInfo = await pool.getTradeInfo();
      amountOut = await dmmHelper.getAmountOut(swapAmount, token1, pool);
      await token1.transfer(pool.address, swapAmount);
      await pool.swap(amountOut, 0, trader, '0x');

      await pool.sync();
      Helper.assertEqual(await pool.balanceOf(feeTo), fee);
      Helper.assertEqual(await pool.kLast(), new BN(0));
    });

    it('feeTo:off unamplified pool', async () => {
      [factory, pool] = await setupPool(admin, token0, token1, unamplifiedBps);

      const token0Amount = expandTo18Decimals(1000);
      const token1Amount = expandTo18Decimals(1000);
      await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);

      const swapAmount = expandTo18Decimals(1);
      let amountOut = await dmmHelper.getAmountOut(swapAmount, token1, pool);
      await token1.transfer(pool.address, swapAmount);
      await pool.swap(amountOut, 0, trader, '0x');

      const expectedLiquidity = expandTo18Decimals(1000);
      await pool.transfer(pool.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY), {from: liquidityProvider});
      await pool.burn(liquidityProvider);
      Helper.assertEqual(await pool.totalSupply(), MINIMUM_LIQUIDITY);
      Helper.assertEqual(await pool.kLast(), new BN(0));
      // turn on fee.
      await factory.setFeeConfiguration(feeTo, new BN(1000));
      await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);
      Helper.assertGreater(await pool.kLast(), new BN(0));
      Helper.assertEqual(await pool.balanceOf(feeTo), new BN(0));
    });

    it('feeTo:off amp pool', async () => {
      [factory, pool] = await setupPool(admin, token0, token1, ampBps);

      const token0Amount = expandTo18Decimals(1000);
      const token1Amount = expandTo18Decimals(1000);
      await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);

      const swapAmount = expandTo18Decimals(1);
      let amountOut = await dmmHelper.getAmountOut(swapAmount, token1, pool);
      await token1.transfer(pool.address, swapAmount);
      await pool.swap(amountOut, 0, trader, '0x');

      const expectedLiquidity = expandTo18Decimals(1000);
      await pool.transfer(pool.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY), {from: liquidityProvider});
      await pool.burn(liquidityProvider);
      Helper.assertEqual(await pool.totalSupply(), MINIMUM_LIQUIDITY);
    });
  });

  describe('sync', async () => {
    it('case 1: donation from 1 side', async () => {
      [factory, pool] = await setupPool(admin, token0, token1, ampBps);

      const token0Amount = expandTo18Decimals(1);
      const token1Amount = expandTo18Decimals(1);
      await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);

      let tradeInfo = await pool.getTradeInfo();
      let priceRange = dmmHelper.getPriceRange(tradeInfo);
      console.log(`minRate=${priceRange[0].toString()} maxRate=${priceRange[1].toString()}`);

      await token0.transfer(pool.address, expandTo18Decimals(2));
      await pool.sync();

      tradeInfo = await pool.getTradeInfo();
      priceRange = dmmHelper.getPriceRange(tradeInfo);
      console.log(`minRate=${priceRange[0].toString()} maxRate=${priceRange[1].toString()}`);
    });

    it('case 2: donation from 2 side -> reserve data should scale up', async () => {
      [factory, pool] = await setupPool(admin, token0, token1, ampBps);

      const token0Amount = expandTo18Decimals(1);
      const token1Amount = expandTo18Decimals(1);
      await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);

      let tradeInfo = await pool.getTradeInfo();
      let priceRange = dmmHelper.getPriceRange(tradeInfo);

      await token0.transfer(pool.address, expandTo18Decimals(2));
      await token1.transfer(pool.address, expandTo18Decimals(2));
      await pool.sync();

      tradeInfo = await pool.getTradeInfo();
      let priceRange2 = dmmHelper.getPriceRange(tradeInfo);
      Helper.assertEqualArray(priceRange, priceRange2); // unchange price range
    });
  });

  it('skim', async () => {
    [factory, pool] = await setupPool(admin, token0, token1, ampBps);
    const token0Amount = expandTo18Decimals(1000);
    const token1Amount = expandTo18Decimals(1000);
    await addLiquidity(liquidityProvider, pool, token0Amount, token1Amount);

    token0.transfer(pool.address, expandTo18Decimals(1));
    let beforeBalance = await token0.balanceOf(trader);
    await pool.skim(trader);
    let afterBalance = await token0.balanceOf(trader);
    Helper.assertEqual(afterBalance.sub(beforeBalance), expandTo18Decimals(1));

    let tradeInfo = await pool.getTradeInfo();
    Helper.assertEqual(tradeInfo._reserve0, expandTo18Decimals(1000));
    Helper.assertEqual(tradeInfo._reserve1, expandTo18Decimals(1000));
    Helper.assertEqual(tradeInfo._vReserve0, expandTo18Decimals(2000));
    Helper.assertEqual(tradeInfo._vReserve1, expandTo18Decimals(2000));
    // test case overflow
    await token0.transfer(pool.address, new BN(2).pow(new BN(112)));
    await expectRevert(pool.sync(), 'DMM: OVERFLOW');
    await pool.skim(trader);
  });
});

async function addLiquidity (liquidityProvider, pool, token0Amount, token1Amount) {
  await token0.transfer(pool.address, token0Amount);
  await token1.transfer(pool.address, token1Amount);
  await pool.mint(liquidityProvider);
}

async function getTokenPoolBalances (token0, token1, user) {
  return [await token0.balanceOf(user), await token1.balanceOf(user)];
}

async function assertTokenPoolBalances (token0, token1, user, expectedBalances) {
  Helper.assertEqual(await token0.balanceOf(user), expectedBalances[0], 'unmatch token0 balance');
  Helper.assertEqual(await token1.balanceOf(user), expectedBalances[1], 'unmatch token1 balance');
}

async function setupFactory (admin) {
  return await DMMFactory.new(admin);
}

async function setupPool (admin, tokenA, tokenB, ampBps) {
  let factory = await setupFactory(admin);

  await factory.createPool(tokenA.address, tokenB.address, ampBps);
  const poolAddrs = await factory.getPools(tokenA.address, tokenB.address);
  const pool = await DMMPool.at(poolAddrs[0]);

  return [factory, pool];
}
