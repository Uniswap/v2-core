const TestToken = artifacts.require('TestToken');
const XYZSwapFactory = artifacts.require('XYZSwapFactory');
const XYZSwapPair = artifacts.require('XYZSwapPair');

const {expectEvent, expectRevert, constants} = require('@openzeppelin/test-helpers');
const {assert} = require('chai');
const BN = web3.utils.BN;

const Helper = require('./helper');
const {expandTo18Decimals, precisionUnits} = require('./helper');

const MINIMUM_LIQUIDITY = new BN(1000);

let token0;
let token1;
let factory;
let pair;
let trader;
let feeTo;
let liquidityProvider;
let app;

contract('XYZSwapPair', function (accounts) {
  beforeEach('setup', async () => {
    [factory, token0, token1, pair] = await setupPair(accounts[0]);
    trader = accounts[1];
    app = accounts[2];
    liquidityProvider = accounts[3];
    feeTo = accounts[4];
  });

  // this test is for print bytecode hash for xyzSwapLibrary
  it('print bytecode hash', async () => {
    console.log(web3.utils.sha3(XYZSwapPair.bytecode));
  });

  it('can not initialize not by factory', async () => {
    const token0Amount = expandTo18Decimals(5);
    const token1Amount = expandTo18Decimals(10);
    await addLiquidity(liquidityProvider, token0Amount, token1Amount);
    await expectRevert(pair.initialize(token0.address, token1.address), 'XYZSwap: FORBIDDEN');
  });

  it('mint', async () => {
    const token0Amount = Helper.expandTo18Decimals(1);
    const token1Amount = Helper.expandTo18Decimals(4);
    await token0.transfer(pair.address, token0Amount);
    await token1.transfer(pair.address, token1Amount);

    const expectedLiquidity = Helper.expandTo18Decimals(2);
    let result = await pair.mint(trader, {from: app});

    expectEvent(result, 'Mint', {sender: app, amount0: token0Amount, amount1: token1Amount});
    expectEvent(result, 'Transfer', {
      from: constants.ZERO_ADDRESS,
      to: trader,
      value: expectedLiquidity.sub(MINIMUM_LIQUIDITY)
    });
    expectEvent(result, 'Sync', {reserve0: token0Amount, reserve1: token1Amount});

    Helper.assertEqual(await pair.totalSupply(), expectedLiquidity, 'unexpected totalSupply');
    Helper.assertEqual(await pair.balanceOf(trader), expectedLiquidity.sub(MINIMUM_LIQUIDITY));

    Helper.assertEqual(await token0.balanceOf(pair.address), token0Amount);
    Helper.assertEqual(await token1.balanceOf(pair.address), token1Amount);

    const reserves = await pair.getReserves();
    Helper.assertEqual(reserves._reserve0, token0Amount);
    Helper.assertEqual(reserves._reserve1, token1Amount);

    const updateToken0Amount = Helper.expandTo18Decimals(2);
    const updateToken1Amount = Helper.expandTo18Decimals(2);
    await token0.transfer(pair.address, updateToken0Amount);
    // if transfer only 1 token, trade will revert
    await expectRevert(pair.mint(trader, {from: app}), 'XYZSwap: INSUFFICIENT_LIQUIDITY_MINTED');

    await token1.transfer(pair.address, updateToken1Amount);
    result = await pair.mint(trader, {from: app});
    // the amount mint will be the min ratio with reserve0 and reserve1
    expectEvent(result, 'Transfer', {
      from: constants.ZERO_ADDRESS,
      to: trader,
      value: expectedLiquidity.div(new BN(2))
    });
    Helper.assertEqual(
      await pair.balanceOf(trader),
      expectedLiquidity.sub(MINIMUM_LIQUIDITY).add(expectedLiquidity.div(new BN(2)))
    );
  });

  /// [swapAmount, token0Amount, token1Amount, expectedOutputAmount]
  const swapTestCases = [
    [1, 5, 10, '1662497915624478906'],
    [1, 10, 5, '453305446940074565'],

    [2, 5, 10, '2851015155847869602'],
    [2, 10, 5, '831248957812239453'],

    [1, 10, 10, '906610893880149131'],
    [1, 100, 100, '987158034397061298'],
    [1, 1000, 1000, '996006981039903216']
  ];
  swapTestCases.forEach((testCase, i) => {
    it(`getInputPrice:${i}`, async () => {
      const [swapAmount, token0Amount, token1Amount] = testCase;
      await addLiquidity(liquidityProvider, expandTo18Decimals(token0Amount), expandTo18Decimals(token1Amount));
      await token0.transfer(pair.address, expandTo18Decimals(swapAmount));
      let result = await pair.getTradeInfo();

      let expectedOutputAmount = getExpectedOutputAmount(
        expandTo18Decimals(swapAmount),
        expandTo18Decimals(token0Amount),
        expandTo18Decimals(token1Amount),
        result.feeInPrecision
      );
      await expectRevert(pair.swap(0, expectedOutputAmount.add(new BN(1)), trader, '0x'), 'XYZSwap: K');
      await pair.swap(0, new BN(expectedOutputAmount), trader, '0x');
    });
  });

  function getExpectedOutputAmount (amountIn, reserveIn, reserveOut, fee) {
    let amountInWithFee = amountIn.mul(precisionUnits.sub(fee)).div(precisionUnits);
    let numerator = reserveIn.mul(reserveOut);
    let denominator = reserveIn.add(amountInWithFee);
    return reserveOut.sub(numerator.add(denominator.sub(new BN(1))).div(denominator));
  }

  const optimisticTestCases = [
    [new BN('997000000000000000'), expandTo18Decimals(5), expandTo18Decimals(10), expandTo18Decimals(1)], // given amountIn, amountOut = floor(amountIn * .997)
    [new BN('997000000000000000'), expandTo18Decimals(10), expandTo18Decimals(5), expandTo18Decimals(1)],
    [new BN('997000000000000000'), expandTo18Decimals(5), expandTo18Decimals(5), expandTo18Decimals(1)],
    [expandTo18Decimals(1), expandTo18Decimals(5), expandTo18Decimals(5), new BN('1003009027081243732')] // given amountOut, amountIn = ceiling(amountOut / .997)
  ];
  optimisticTestCases.forEach((testCase, i) => {
    it(`optimistic:${i}`, async () => {
      const [, token0Amount, token1Amount, inputAmount] = testCase;
      await addLiquidity(liquidityProvider, token0Amount, token1Amount);
      await token0.transfer(pair.address, inputAmount);

      let result = await pair.getTradeInfo();

      let outputAmount = inputAmount.mul(precisionUnits.sub(result.feeInPrecision)).div(precisionUnits);
      await expectRevert(pair.swap(outputAmount.add(new BN(1)), 0, trader, '0x'), 'XYZSwap: K');
      await pair.swap(outputAmount, 0, trader, '0x');
    });
  });

  it('swap:validating', async () => {
    const token0Amount = expandTo18Decimals(5);
    const token1Amount = expandTo18Decimals(10);
    await addLiquidity(liquidityProvider, token0Amount, token1Amount);

    const swapAmount = expandTo18Decimals(1);
    let tradeInfo = await pair.getTradeInfo();
    let expectedOutputAmount = getExpectedOutputAmount(
      swapAmount,
      token0Amount,
      token1Amount,
      tradeInfo.feeInPrecision
    );
    // when amountIn = 0 -> revert
    await expectRevert(
      pair.swap(new BN(0), expectedOutputAmount, trader, '0x', {from: app}),
      'XYZSwap: INSUFFICIENT_INPUT_AMOUNT'
    );
    // when amountOut = 0 -> revert
    await token0.transfer(pair.address, swapAmount);
    await expectRevert(
      pair.swap(new BN(0), new BN(0), trader, '0x', {from: app}),
      'XYZSwap: INSUFFICIENT_OUTPUT_AMOUNT'
    );
    // when amountOut > liquidity -> revert
    await expectRevert(
      pair.swap(new BN(0), token1Amount.add(new BN(1)), trader, '0x', {from: app}),
      'XYZSwap: INSUFFICIENT_LIQUIDITY'
    );
    // revert when destAddres is token0 or token1
    await expectRevert(
      pair.swap(new BN(0), expectedOutputAmount, token0.address, '0x', {from: app}),
      'XYZSwap: INVALID_TO'
    );
    // normal swap if everything is valid
    pair.swap(new BN(0), expectedOutputAmount, trader, '0x', {from: app});
  });

  it('swap:token0', async () => {
    const token0Amount = expandTo18Decimals(5);
    const token1Amount = expandTo18Decimals(10);
    await addLiquidity(liquidityProvider, token0Amount, token1Amount);

    const swapAmount = expandTo18Decimals(1);
    let tradeInfo = await pair.getTradeInfo();
    let expectedOutputAmount = getExpectedOutputAmount(
      swapAmount,
      token0Amount,
      token1Amount,
      tradeInfo.feeInPrecision
    );

    await token0.transfer(pair.address, swapAmount);

    let beforeBalanceToken0 = await token0.balanceOf(trader);
    let beforeBalanceToken1 = await token1.balanceOf(trader);
    let result = await pair.swap(new BN(0), expectedOutputAmount, trader, '0x', {from: app});

    expectEvent(result, 'Sync', {
      reserve0: token0Amount.add(swapAmount),
      reserve1: token1Amount.sub(expectedOutputAmount)
    });

    expectEvent(result, 'Swap', {
      sender: app,
      amount0In: swapAmount,
      amount1In: new BN(0),
      amount0Out: new BN(0),
      amount1Out: expectedOutputAmount,
      to: trader
    });

    const reserves = await pair.getReserves();
    Helper.assertEqual(reserves._reserve0, token0Amount.add(swapAmount));
    Helper.assertEqual(reserves._reserve1, token1Amount.sub(expectedOutputAmount));
    Helper.assertEqual(await token0.balanceOf(pair.address), token0Amount.add(swapAmount));
    Helper.assertEqual(await token1.balanceOf(pair.address), token1Amount.sub(expectedOutputAmount));
    // balance of token0 should be unchanged after transfer
    Helper.assertEqual(await token0.balanceOf(trader), beforeBalanceToken0);
    // balance of token1 should increase by amountOut
    Helper.assertEqual(await token1.balanceOf(trader), beforeBalanceToken1.add(expectedOutputAmount));
  });

  it('swap:token1', async () => {
    const token0Amount = expandTo18Decimals(5);
    const token1Amount = expandTo18Decimals(10);
    await addLiquidity(liquidityProvider, token0Amount, token1Amount);

    const swapAmount = expandTo18Decimals(1);
    let tradeInfo = await pair.getTradeInfo();
    let expectedOutputAmount = getExpectedOutputAmount(
      swapAmount,
      token1Amount,
      token0Amount,
      tradeInfo.feeInPrecision
    );
    await token1.transfer(pair.address, swapAmount);

    let beforeBalanceToken0 = await token0.balanceOf(trader);
    let beforeBalanceToken1 = await token1.balanceOf(trader);
    let result = await pair.swap(expectedOutputAmount, new BN(0), trader, '0x', {from: app});

    expectEvent(result, 'Sync', {
      reserve0: token0Amount.sub(expectedOutputAmount),
      reserve1: token1Amount.add(swapAmount)
    });

    expectEvent(result, 'Swap', {
      sender: app,
      amount0In: new BN(0),
      amount1In: swapAmount,
      amount0Out: expectedOutputAmount,
      amount1Out: new BN(0),
      to: trader
    });

    const reserves = await pair.getReserves();
    Helper.assertEqual(reserves._reserve0, token0Amount.sub(expectedOutputAmount));
    Helper.assertEqual(reserves._reserve1, token1Amount.add(swapAmount));
    Helper.assertEqual(await token0.balanceOf(pair.address), token0Amount.sub(expectedOutputAmount));
    Helper.assertEqual(await token1.balanceOf(pair.address), token1Amount.add(swapAmount));
    // balance of token0 should increase by amountOut
    Helper.assertEqual(await token0.balanceOf(trader), beforeBalanceToken0.add(expectedOutputAmount));
    // balance of token1 should be unchanged after transfer
    Helper.assertEqual(await token1.balanceOf(trader), beforeBalanceToken1);
  });

  it('swap:gas', async () => {
    const token0Amount = expandTo18Decimals(5);
    const token1Amount = expandTo18Decimals(10);
    await addLiquidity(liquidityProvider, token0Amount, token1Amount);

    const swapAmount = expandTo18Decimals(1);
    let tradeInfo = await pair.getTradeInfo();
    let expectedOutputAmount = getExpectedOutputAmount(
      swapAmount,
      token1Amount,
      token0Amount,
      tradeInfo.feeInPrecision
    );
    await token1.transfer(pair.address, swapAmount);
    await token0.transfer(trader, new BN(1));

    const tx = await pair.swap(expectedOutputAmount, new BN(0), trader, '0x');
    // this number of uniswap is 73462
    console.log(`gas used: ${tx.receipt.gasUsed}`);
  });

  it('burn', async () => {
    const token0Amount = expandTo18Decimals(3);
    const token1Amount = expandTo18Decimals(3);
    await addLiquidity(liquidityProvider, token0Amount, token1Amount);

    // revert if liquidity burn is 0
    await expectRevert(pair.burn(liquidityProvider, {from: app}), 'XYZSwap: INSUFFICIENT_LIQUIDITY_BURNED');

    const expectedLiquidity = expandTo18Decimals(3);
    let beforeAmountToken0 = await token0.balanceOf(liquidityProvider);
    let beforeAmountToken1 = await token1.balanceOf(liquidityProvider);

    await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY), {from: liquidityProvider});
    let result = await pair.burn(liquidityProvider, {from: app});

    expectEvent(result, 'Transfer', {
      from: pair.address,
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

    Helper.assertEqual(await pair.balanceOf(liquidityProvider), new BN(0));
    Helper.assertEqual(await pair.totalSupply(), MINIMUM_LIQUIDITY);
    Helper.assertEqual(await token0.balanceOf(pair.address), new BN(1000));
    Helper.assertEqual(await token1.balanceOf(pair.address), new BN(1000));

    Helper.assertEqual(
      await token0.balanceOf(liquidityProvider),
      beforeAmountToken0.add(token0Amount.sub(MINIMUM_LIQUIDITY))
    );
    Helper.assertEqual(
      await token1.balanceOf(liquidityProvider),
      beforeAmountToken1.add(token1Amount.sub(MINIMUM_LIQUIDITY))
    );
    console.log(`burn gas used ${result.receipt.gasUsed}`);
  });

  it('feeTo:off', async () => {
    const token0Amount = expandTo18Decimals(1000);
    const token1Amount = expandTo18Decimals(1000);
    await addLiquidity(liquidityProvider, token0Amount, token1Amount);

    const swapAmount = expandTo18Decimals(1);
    let tradeInfo = await pair.getTradeInfo();
    let expectedOutputAmount = getExpectedOutputAmount(
      swapAmount,
      token1Amount,
      token0Amount,
      tradeInfo.feeInPrecision
    );
    await token1.transfer(pair.address, swapAmount);
    await pair.swap(expectedOutputAmount, 0, trader, '0x');

    const expectedLiquidity = expandTo18Decimals(1000);
    await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY), {from: liquidityProvider});
    await pair.burn(liquidityProvider);
    Helper.assertEqual(await pair.totalSupply(), MINIMUM_LIQUIDITY);
  });

  it('feeTo:on', async () => {
    await factory.setFeeTo(feeTo, {from: accounts[0]});

    const token0Amount = expandTo18Decimals(1000);
    const token1Amount = expandTo18Decimals(1000);
    await addLiquidity(liquidityProvider, token0Amount, token1Amount);
    let totalSuppy = await pair.totalSupply();

    const swapAmount = expandTo18Decimals(1);
    let tradeInfo = await pair.getTradeInfo();
    let expectedOutputAmount = getExpectedOutputAmount(
      swapAmount,
      token1Amount,
      token0Amount,
      tradeInfo.feeInPrecision
    );
    await token1.transfer(pair.address, swapAmount);
    await pair.swap(expectedOutputAmount, 0, trader, '0x');

    const expectedLiquidity = expandTo18Decimals(1000);
    await pair.transfer(pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY), {from: liquidityProvider});
    await pair.burn(liquidityProvider);

    let rootK = Helper.sqrt(token1Amount.add(swapAmount).mul(token0Amount.sub(expectedOutputAmount)));
    let rootKLast = Helper.sqrt(token1Amount.mul(token0Amount));
    let fee = totalSuppy.mul(rootK.sub(rootKLast)).div(rootK.mul(new BN(5)).add(rootKLast));

    Helper.assertEqual(await pair.totalSupply(), MINIMUM_LIQUIDITY.add(fee));
    Helper.assertEqual(await pair.balanceOf(feeTo), fee);

    // add liquidity will not be charged fee
    await addLiquidity(liquidityProvider, token0Amount, token1Amount);
    Helper.assertEqual(await pair.balanceOf(feeTo), fee);

    // disable fee again
    await factory.setFeeTo(constants.ZERO_ADDRESS, {from: accounts[0]});
    await addLiquidity(liquidityProvider, token0Amount, token1Amount);

    tradeInfo = await pair.getTradeInfo();
    expectedOutputAmount = getExpectedOutputAmount(swapAmount, token1Amount, token0Amount, tradeInfo.feeInPrecision);
    await token1.transfer(pair.address, swapAmount);
    await pair.swap(expectedOutputAmount, 0, trader, '0x');

    await pair.sync();
    Helper.assertEqual(await pair.balanceOf(feeTo), fee);
  });

  it('sync', async () => {
    const token0Amount = expandTo18Decimals(1000);
    const token1Amount = expandTo18Decimals(1000);
    await addLiquidity(liquidityProvider, token0Amount, token1Amount);

    token0.transfer(pair.address, expandTo18Decimals(1));
    await pair.sync();

    let reserves = await pair.getReserves();
    Helper.assertEqual(reserves._reserve0, expandTo18Decimals(1001));
    Helper.assertEqual(reserves._reserve1, expandTo18Decimals(1000));
  });

  it('skim', async () => {
    const token0Amount = expandTo18Decimals(1000);
    const token1Amount = expandTo18Decimals(1000);
    await addLiquidity(liquidityProvider, token0Amount, token1Amount);

    token0.transfer(pair.address, expandTo18Decimals(1));
    let beforeBalance = await token0.balanceOf(trader);
    await pair.skim(trader);
    let afterBalance = await token0.balanceOf(trader);
    Helper.assertEqual(afterBalance.sub(beforeBalance), expandTo18Decimals(1));

    let reserves = await pair.getReserves();
    Helper.assertEqual(reserves._reserve0, expandTo18Decimals(1000));
    Helper.assertEqual(reserves._reserve1, expandTo18Decimals(1000));
  });
});

async function addLiquidity (liquidityProvider, token0Amount, token1Amount) {
  await token0.transfer(pair.address, token0Amount);
  await token1.transfer(pair.address, token1Amount);
  await pair.mint(liquidityProvider);
}

async function setupFactory (admin) {
  return await XYZSwapFactory.new(admin);
}

async function setupPair (admin) {
  let factory = await setupFactory(admin);
  let tokenA = await TestToken.new('test token A', 'A', Helper.expandTo18Decimals(10000));
  let tokenB = await TestToken.new('test token B', 'B', Helper.expandTo18Decimals(10000));

  await factory.createPair(tokenA.address, tokenB.address);
  const pairAddr = await factory.getPair(tokenA.address, tokenB.address);
  const pair = await XYZSwapPair.at(pairAddr);

  const token0Address = await pair.token0();
  const token0 = tokenA.address === token0Address ? tokenA : tokenB;
  const token1 = tokenA.address === token0Address ? tokenB : tokenA;

  return [factory, token0, token1, pair];
}
