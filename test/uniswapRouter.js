const Helper = require('./helper');
const BN = web3.utils.BN;

const {precisionUnits, MINIMUM_LIQUIDITY} = require('./helper');
const {expectEvent, expectRevert, constants} = require('@openzeppelin/test-helpers');

const UniswapV2Router = artifacts.require('UniswapV2Router01');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const IUniswapV2Pair = artifacts.require('IUniswapV2Pair');
const UniswapV2Pair = artifacts.require('UniswapV2Pair');
const TestToken = artifacts.require('TestToken');
const WETH9 = artifacts.require('WETH9');

const bigAmount = new BN(2).pow(new BN(250));

let trader;
let feeTo;
let liquidityProvider;
let app;
let factory;
let token0;
let token1;
let WETH;
let WETHPartner;
let WETHPair;
let router;
let pair;
let initTokenAmount = Helper.expandTo18Decimals(1000);

contract('UniswapV2Router', function (accounts) {
  beforeEach('setup', async () => {
    trader = accounts[1];
    app = accounts[2];
    liquidityProvider = accounts[3];
    feeTo = accounts[4];

    factory = await UniswapV2Factory.new(accounts[0]);
    let tokenA = await TestToken.new('test token A', 'A', Helper.expandTo18Decimals(10000));
    let tokenB = await TestToken.new('test token B', 'B', Helper.expandTo18Decimals(10000));
    tokenA.transfer(trader, initTokenAmount);
    tokenB.transfer(trader, initTokenAmount);

    await factory.createPair(tokenA.address, tokenB.address);
    const pairAddr = await factory.getPair(tokenA.address, tokenB.address);
    pair = await UniswapV2Pair.at(pairAddr);

    WETH = await WETH9.new();
    WETHPartner = await TestToken.new('WETH Partner', 'WETH-P', Helper.expandTo18Decimals(10000));
    await WETHPartner.transfer(trader, initTokenAmount);

    const token0Address = await pair.token0();
    token0 = tokenA.address === token0Address ? tokenA : tokenB;
    token1 = tokenA.address === token0Address ? tokenB : tokenA;

    router = await UniswapV2Router.new(factory.address, WETH.address);

    await factory.createPair(WETH.address, WETHPartner.address);
    const wethPairAddress = await factory.getPair(WETH.address, WETHPartner.address);
    WETHPair = await UniswapV2Pair.at(wethPairAddress);
  });

  it('factory, WETH', async () => {
    Helper.assertEqual(await router.factory(), factory.address);
    Helper.assertEqual(await router.WETH(), WETH.address);
  });

  it('addLiquidity', async () => {
    const token0Amount = Helper.expandTo18Decimals(1);
    const token1Amount = Helper.expandTo18Decimals(4);

    let expectedLiquidity = Helper.expandTo18Decimals(2);

    await token0.approve(router.address, bigAmount, {from: trader});
    await token1.approve(router.address, bigAmount, {from: trader});

    let result = await router.addLiquidity(
      token0.address,
      token1.address,
      token0Amount,
      token1Amount,
      0,
      0,
      trader,
      bigAmount,
      {from: trader}
    );
    await expectEvent.inTransaction(result.tx, pair, 'Sync', {
      reserve0: token0Amount,
      reserve1: token1Amount,
    });
    await expectEvent.inTransaction(result.tx, pair, 'Mint', {
      sender: router.address,
      amount0: token0Amount,
      amount1: token1Amount,
    });
  });

  it('addLiquidityETH', async () => {
    const WETHPartnerAmount = Helper.expandTo18Decimals(1);
    const ETHAmount = Helper.expandTo18Decimals(4);

    const expectedLiquidity = Helper.expandTo18Decimals(2);
    const WETHPairToken0 = await WETHPair.token0();
    await WETHPartner.approve(router.address, bigAmount, {from: trader});

    let result = await router.addLiquidityETH(
      WETHPartner.address,
      WETHPartnerAmount,
      WETHPartnerAmount,
      ETHAmount,
      trader,
      bigAmount,
      {from: trader, value: ETHAmount}
    );
    await expectEvent.inTransaction(result.tx, WETHPair, 'Sync', {
      reserve0: WETHPairToken0 === WETHPartner.address ? WETHPartnerAmount : ETHAmount,
      reserve1: WETHPairToken0 === WETHPartner.address ? ETHAmount : WETHPartnerAmount,
    });
    await expectEvent.inTransaction(result.tx, pair, 'Mint', {
      sender: router.address,
      amount0: WETHPairToken0 === WETHPartner.address ? WETHPartnerAmount : ETHAmount,
      amount1: WETHPairToken0 === WETHPartner.address ? ETHAmount : WETHPartnerAmount,
    });
    Helper.assertEqual(await WETHPair.balanceOf(trader), expectedLiquidity.sub(MINIMUM_LIQUIDITY));
  });

  it('removeLiquidity', async () => {
    const token0Amount = Helper.expandTo18Decimals(1);
    const token1Amount = Helper.expandTo18Decimals(4);
    await token0.transfer(pair.address, token0Amount, {from: trader});
    await token1.transfer(pair.address, token1Amount, {from: trader});
    await pair.mint(trader);

    const expectedLiquidity = Helper.expandTo18Decimals(2);
    await pair.approve(router.address, bigAmount, {from: trader});
    let result = await router.removeLiquidity(
      token0.address,
      token1.address,
      expectedLiquidity.sub(MINIMUM_LIQUIDITY),
      0,
      0,
      trader,
      bigAmount,
      {from: trader}
    );
    console.log(pair.address, token0.address, token1.address, trader);
    await expectEvent.inTransaction(result.tx, pair, 'Sync', {
      reserve0: new BN(500),
      reserve1: new BN(2000),
    });
    await expectEvent.inTransaction(result.tx, pair, 'Burn', {
      sender: router.address,
      amount0: token0Amount.sub(new BN(500)),
      amount1: token1Amount.sub(new BN(2000)),
      to: trader,
    });

    Helper.assertEqual(await pair.balanceOf(trader), new BN(0));
    Helper.assertEqual(await token0.balanceOf(trader), initTokenAmount.sub(new BN(500)));
    Helper.assertEqual(await token1.balanceOf(trader), initTokenAmount.sub(new BN(2000)));
  });

  it('removeLiquidityETH', async () => {
    const WETHPartnerAmount = Helper.expandTo18Decimals(1);
    const ETHAmount = Helper.expandTo18Decimals(4);
    await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount, {from: trader});
    await WETH.deposit({from: trader, value: ETHAmount});
    await WETH.transfer(WETHPair.address, ETHAmount, {from: trader});
    await WETHPair.mint(trader);

    const expectedLiquidity = Helper.expandTo18Decimals(2);
    const WETHPairToken0 = await WETHPair.token0();
    await WETHPair.approve(router.address, bigAmount, {from: trader});
    let result = await router.removeLiquidityETH(
      WETHPartner.address,
      expectedLiquidity.sub(MINIMUM_LIQUIDITY),
      0,
      0,
      trader,
      bigAmount,
      {from: trader}
    );
    await expectEvent.inTransaction(result.tx, WETHPair, 'Sync', {
      reserve0: WETHPairToken0 === WETHPartner.address ? new BN(500) : new BN(2000),
      reserve1: WETHPairToken0 === WETHPartner.address ? new BN(2000) : new BN(500),
    });

    await expectEvent.inTransaction(result.tx, WETHPair, 'Burn', {
      sender: router.address,
      amount0:
        WETHPairToken0 === WETHPartner.address ? WETHPartnerAmount.sub(new BN(500)) : ETHAmount.sub(new BN(2000)),
      amount1:
        WETHPairToken0 === WETHPartner.address ? ETHAmount.sub(new BN(2000)) : WETHPartnerAmount.sub(new BN(500)),
      to: router.address,
    });
    Helper.assertEqual(await WETHPair.balanceOf(trader), new BN(0));
    Helper.assertEqual(await WETHPartner.balanceOf(trader), initTokenAmount.sub(new BN(500)));
  });

  it('swapETHForExactTokens', async () => {
    const WETHPartnerAmount = Helper.expandTo18Decimals(10);
    const ETHAmount = Helper.expandTo18Decimals(5);
    const outputAmount = Helper.expandTo18Decimals(1);
    const swapAmount = new BN('565227237267357629');
    // init pair
    await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount);
    await WETH.deposit({value: ETHAmount});
    await WETH.transfer(WETHPair.address, ETHAmount);
    await WETHPair.mint(trader);
    const WETHPairToken0 = await WETHPair.token0();
    let tradeInfo = await WETHPair.getTradeInfo();
    let reserveIn = WETHPairToken0 == WETHPartner.address ? tradeInfo._reserve1 : tradeInfo._reserve0;
    let reserveOut = WETHPairToken0 == WETHPartner.address ? tradeInfo._reserve0 : tradeInfo._reserve1;
    let expectAmountIn = await router.getAmountIn(outputAmount, reserveIn, reserveOut, tradeInfo.feeInPrecision);
    let ethBalance = await Helper.getBalancePromise(trader);

    let result = await router.swapETHForExactTokens(
      outputAmount,
      [WETH.address, WETHPartner.address],
      trader,
      bigAmount,
      {
        from: trader,
        value: swapAmount,
        gasPrice: new BN(0),
      }
    );

    await expectEvent.inTransaction(result.tx, WETHPair, 'Swap', {
      sender: router.address,
      amount0In: WETHPairToken0 === WETHPartner.address ? new BN(0) : expectAmountIn,
      amount1In: WETHPairToken0 === WETHPartner.address ? expectAmountIn : new BN(0),
      amount0Out: WETHPairToken0 === WETHPartner.address ? outputAmount : new BN(0),
      amount1Out: WETHPairToken0 === WETHPartner.address ? new BN(0) : outputAmount,
      to: trader,
    });
    await expectEvent.inTransaction(result.tx, WETHPair, 'Sync', {
      reserve0:
        WETHPairToken0 === WETHPartner.address ? WETHPartnerAmount.sub(outputAmount) : ETHAmount.add(expectAmountIn),
      reserve1:
        WETHPairToken0 === WETHPartner.address ? ETHAmount.add(expectAmountIn) : WETHPartnerAmount.sub(outputAmount),
    });

    Helper.assertEqual(await WETHPartner.balanceOf(trader), initTokenAmount.add(outputAmount));
    Helper.assertEqual(await Helper.getBalancePromise(trader), ethBalance.sub(expectAmountIn));
  });

  it('swapExactTokensForETH', async () => {
    const WETHPartnerAmount = Helper.expandTo18Decimals(5);
    const ETHAmount = Helper.expandTo18Decimals(10);
    const swapAmount = Helper.expandTo18Decimals(1);

    await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount);
    await WETH.deposit({value: ETHAmount});
    await WETH.transfer(WETHPair.address, ETHAmount);
    await WETHPair.mint(trader);

    const WETHPairToken0 = await WETHPair.token0();
    let tradeInfo = await WETHPair.getTradeInfo();
    let reserveOut = WETHPairToken0 == WETHPartner.address ? tradeInfo._reserve1 : tradeInfo._reserve0;
    let reserveIn = WETHPairToken0 == WETHPartner.address ? tradeInfo._reserve0 : tradeInfo._reserve1;
    let expectAmountOut = await router.getAmountOut(swapAmount, reserveIn, reserveOut, tradeInfo.feeInPrecision);

    await WETHPartner.approve(router.address, bigAmount, {from: trader});
    let ethBalance = await Helper.getBalancePromise(trader);

    let result = await router.swapExactTokensForETH(
      swapAmount,
      0,
      [WETHPartner.address, WETH.address],
      trader,
      bigAmount,
      {
        from: trader,
        gasPrice: new BN(0),
      }
    );

    await expectEvent.inTransaction(result.tx, WETHPair, 'Sync', {
      reserve0:
        WETHPairToken0 === WETHPartner.address ? WETHPartnerAmount.add(swapAmount) : ETHAmount.sub(expectAmountOut),
      reserve1:
        WETHPairToken0 === WETHPartner.address ? ETHAmount.sub(expectAmountOut) : WETHPartnerAmount.add(swapAmount),
    });
    await expectEvent.inTransaction(result.tx, WETHPair, 'Swap', {
      sender: router.address,
      amount0In: WETHPairToken0 === WETHPartner.address ? swapAmount : new BN(0),
      amount1In: WETHPairToken0 === WETHPartner.address ? new BN(0) : swapAmount,
      amount0Out: WETHPairToken0 === WETHPartner.address ? new BN(0) : expectAmountOut,
      amount1Out: WETHPairToken0 === WETHPartner.address ? expectAmountOut : new BN(0),
      to: router.address,
    });

    Helper.assertEqual(await WETHPartner.balanceOf(trader), initTokenAmount.sub(swapAmount));
    Helper.assertEqual(await Helper.getBalancePromise(trader), ethBalance.add(expectAmountOut));
  });

  it('swapTokensForExactETH', async () => {
    const WETHPartnerAmount = Helper.expandTo18Decimals(5);
    const ETHAmount = Helper.expandTo18Decimals(10);
    const outputAmount = Helper.expandTo18Decimals(1);

    await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount);
    await WETH.deposit({value: ETHAmount});
    await WETH.transfer(WETHPair.address, ETHAmount);
    await WETHPair.mint(trader, {from: trader});

    await WETHPartner.approve(router.address, bigAmount, {from: trader});
    const WETHPairToken0 = await WETHPair.token0();

    let tradeInfo = await WETHPair.getTradeInfo();
    let reserveIn = WETHPairToken0 == WETHPartner.address ? tradeInfo._reserve0 : tradeInfo._reserve1;
    let reserveOut = WETHPairToken0 == WETHPartner.address ? tradeInfo._reserve1 : tradeInfo._reserve0;
    let expectAmountIn = await router.getAmountIn(outputAmount, reserveIn, reserveOut, tradeInfo.feeInPrecision);

    let ethBalance = await Helper.getBalancePromise(trader);

    let result = await router.swapTokensForExactETH(
      outputAmount,
      bigAmount,
      [WETHPartner.address, WETH.address],
      trader,
      bigAmount,
      {
        from: trader,
        gasPrice: new BN(0),
      }
    );

    await expectEvent.inTransaction(result.tx, WETHPair, 'Sync', {
      reserve0:
        WETHPairToken0 === WETHPartner.address ? WETHPartnerAmount.add(expectAmountIn) : ETHAmount.sub(outputAmount),
      reserve1:
        WETHPairToken0 === WETHPartner.address ? ETHAmount.sub(outputAmount) : WETHPartnerAmount.add(expectAmountIn),
    });
    await expectEvent.inTransaction(result.tx, WETHPair, 'Swap', {
      sender: router.address,
      amount0In: WETHPairToken0 === WETHPartner.address ? expectAmountIn : new BN(0),
      amount1In: WETHPairToken0 === WETHPartner.address ? new BN(0) : expectAmountIn,
      amount0Out: WETHPairToken0 === WETHPartner.address ? new BN(0) : outputAmount,
      amount1Out: WETHPairToken0 === WETHPartner.address ? outputAmount : new BN(0),
      to: router.address,
    });

    Helper.assertEqual(await WETHPartner.balanceOf(trader), initTokenAmount.sub(expectAmountIn));
    Helper.assertEqual(await Helper.getBalancePromise(trader), ethBalance.add(outputAmount));
  });

  it('swapExactETHForTokens', async () => {
    const WETHPartnerAmount = Helper.expandTo18Decimals(10);
    const ETHAmount = Helper.expandTo18Decimals(5);
    const swapAmount = Helper.expandTo18Decimals(1);

    await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount);
    await WETH.deposit({value: ETHAmount});
    await WETH.transfer(WETHPair.address, ETHAmount);
    await WETHPair.mint(trader);

    await token0.approve(router.address, bigAmount, {from: trader});

    const WETHPairToken0 = await WETHPair.token0();

    let tradeInfo = await WETHPair.getTradeInfo();
    let reserveOut = WETHPairToken0 == WETHPartner.address ? tradeInfo._reserve0 : tradeInfo._reserve1;
    let reserveIn = WETHPairToken0 == WETHPartner.address ? tradeInfo._reserve1 : tradeInfo._reserve0;
    let expectedOutputAmount = await router.getAmountOut(swapAmount, reserveIn, reserveOut, tradeInfo.feeInPrecision);

    let ethBalance = await Helper.getBalancePromise(trader);

    let result = await router.swapExactETHForTokens(0, [WETH.address, WETHPartner.address], trader, bigAmount, {
      from: trader,
      value: swapAmount,
      gasPrice: 0,
    });

    await expectEvent.inTransaction(result.tx, WETHPair, 'Sync', {
      reserve0:
        WETHPairToken0 === WETHPartner.address
          ? WETHPartnerAmount.sub(expectedOutputAmount)
          : ETHAmount.add(swapAmount),
      reserve1:
        WETHPairToken0 === WETHPartner.address
          ? ETHAmount.add(swapAmount)
          : WETHPartnerAmount.sub(expectedOutputAmount),
    });
    await expectEvent.inTransaction(result.tx, WETHPair, 'Swap', {
      sender: router.address,
      amount0In: WETHPairToken0 === WETHPartner.address ? new BN(0) : swapAmount,
      amount1In: WETHPairToken0 === WETHPartner.address ? swapAmount : new BN(0),
      amount0Out: WETHPairToken0 === WETHPartner.address ? expectedOutputAmount : new BN(0),
      amount1Out: WETHPairToken0 === WETHPartner.address ? new BN(0) : expectedOutputAmount,
      to: trader,
    });

    Helper.assertEqual(await WETHPartner.balanceOf(trader), initTokenAmount.add(expectedOutputAmount));
    Helper.assertEqual(await Helper.getBalancePromise(trader), ethBalance.sub(swapAmount));
  });

  it('swapExactTokensForTokens', async () => {
    const token0Amount = Helper.expandTo18Decimals(5);
    const token1Amount = Helper.expandTo18Decimals(10);
    const swapAmount = Helper.expandTo18Decimals(1);

    await token0.transfer(pair.address, token0Amount);
    await token1.transfer(pair.address, token1Amount);
    await pair.mint(trader);
    await token0.approve(router.address, bigAmount, {from: trader});

    let tradeInfo = await pair.getTradeInfo();
    let expectedOutputAmount = await router.getAmountOut(
      swapAmount,
      tradeInfo._reserve0,
      tradeInfo._reserve1,
      tradeInfo.feeInPrecision
    );

    let result = await router.swapExactTokensForTokens(
      swapAmount,
      0,
      [token0.address, token1.address],
      trader,
      bigAmount,
      {from: trader}
    );

    await expectEvent.inTransaction(result.tx, pair, 'Sync', {
      reserve0: token0Amount.add(swapAmount),
      reserve1: token1Amount.sub(expectedOutputAmount),
    });
    await expectEvent.inTransaction(result.tx, pair, 'Swap', {
      sender: router.address,
      amount0In: swapAmount,
      amount1In: new BN(0),
      amount0Out: new BN(0),
      amount1Out: expectedOutputAmount,
      to: trader,
    });

    Helper.assertEqual(await token0.balanceOf(trader), initTokenAmount.sub(swapAmount));
    Helper.assertEqual(await token1.balanceOf(trader), initTokenAmount.add(expectedOutputAmount));
  });

  it('swapTokensForExactTokens', async () => {
    const token0Amount = Helper.expandTo18Decimals(5);
    const token1Amount = Helper.expandTo18Decimals(10);
    const outputAmount = Helper.expandTo18Decimals(1);

    await token0.transfer(pair.address, token0Amount);
    await token1.transfer(pair.address, token1Amount);
    await pair.mint(trader);
    await token0.approve(router.address, bigAmount, {from: trader});

    let tradeInfo = await pair.getTradeInfo();
    let expectedSwapAmount = await router.getAmountIn(
      outputAmount,
      tradeInfo._reserve0,
      tradeInfo._reserve1,
      tradeInfo.feeInPrecision
    );

    let result = await router.swapTokensForExactTokens(
      outputAmount,
      bigAmount,
      [token0.address, token1.address],
      trader,
      bigAmount,
      {from: trader}
    );

    await expectEvent.inTransaction(result.tx, pair, 'Sync', {
      reserve0: token0Amount.add(expectedSwapAmount),
      reserve1: token1Amount.sub(outputAmount),
    });

    await expectEvent.inTransaction(result.tx, pair, 'Swap', {
      sender: router.address,
      amount0In: expectedSwapAmount,
      amount1In: new BN(0),
      amount0Out: new BN(0),
      amount1Out: outputAmount,
      to: trader,
    });

    Helper.assertEqual(await token0.balanceOf(trader), initTokenAmount.sub(expectedSwapAmount));
    Helper.assertEqual(await token1.balanceOf(trader), initTokenAmount.add(outputAmount));
  });
});
