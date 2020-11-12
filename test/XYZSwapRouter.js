const Helper = require('./helper');
const BN = web3.utils.BN;

const {precisionUnits, MINIMUM_LIQUIDITY} = require('./helper');
const {expectEvent, expectRevert, constants} = require('@openzeppelin/test-helpers');

const XYZSwapRouter = artifacts.require('XYZSwapRouter01');
const XYZSwapFactory = artifacts.require('XYZSwapFactory');
const IXYZSwapPair = artifacts.require('IXYZSwapPair');
const XYZSwapPair = artifacts.require('XYZSwapPair');
const TestToken = artifacts.require('TestToken');

const bigAmount = new BN(2).pow(new BN(250));
const ethAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

let trader;
let feeTo;
let liquidityProvider;
let app;
let factory;
let token0;
let token1;
let ethPartner;
let ethPair;
let router;
let pair;
let initTokenAmount = Helper.expandTo18Decimals(1000);

contract('XYZSwapRouter', function (accounts) {
  beforeEach('setup', async () => {
    trader = accounts[1];
    app = accounts[2];
    liquidityProvider = accounts[3];
    feeTo = accounts[4];

    factory = await XYZSwapFactory.new(accounts[0]);
    let tokenA = await TestToken.new('test token A', 'A', Helper.expandTo18Decimals(10000));
    let tokenB = await TestToken.new('test token B', 'B', Helper.expandTo18Decimals(10000));
    tokenA.transfer(trader, initTokenAmount);
    tokenB.transfer(trader, initTokenAmount);

    await factory.createPair(tokenA.address, tokenB.address);
    const pairAddr = await factory.getPair(tokenA.address, tokenB.address);
    pair = await XYZSwapPair.at(pairAddr);

    const token0Address = await pair.token0();
    token0 = tokenA.address === token0Address ? tokenA : tokenB;
    token1 = tokenA.address === token0Address ? tokenB : tokenA;

    ethPartner = await TestToken.new('WETH Partner', 'WETH-P', Helper.expandTo18Decimals(10000));
    await ethPartner.transfer(trader, initTokenAmount);
    await factory.createPair(ethAddress, ethPartner.address);
    const ethPairAddress = await factory.getPair(ethAddress, ethPartner.address);
    ethPair = await XYZSwapPair.at(ethPairAddress);

    router = await XYZSwapRouter.new(factory.address);
  });

  it('factory, ETH', async () => {
    Helper.assertEqual(await router.factory(), factory.address);
    Helper.assertEqual(await router.ETH_ADDRESS(), ethAddress);
  });

  it('addLiquidity with pair is not created', async () => {
    let factory = await XYZSwapFactory.new(accounts[0]);
    let router = await XYZSwapRouter.new(factory.address);

    let tokenA = await TestToken.new('test token A', 'A', Helper.expandTo18Decimals(10000));
    let tokenB = await TestToken.new('test token B', 'B', Helper.expandTo18Decimals(10000));
    tokenA.transfer(trader, initTokenAmount);
    tokenB.transfer(trader, initTokenAmount);

    await token0.approve(router.address, bigAmount, {from: trader});
    await token1.approve(router.address, bigAmount, {from: trader});

    const token0Amount = Helper.expandTo18Decimals(1);
    const token1Amount = Helper.expandTo18Decimals(4);

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
    console.log('gas used', result.receipt.gasUsed);
    await expectEvent.inTransaction(result.tx, pair, 'Sync', {
      reserve0: token0Amount,
      reserve1: token1Amount
    });
    await expectEvent.inTransaction(result.tx, pair, 'Mint', {
      sender: router.address,
      amount0: token0Amount,
      amount1: token1Amount
    });
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
    console.log('gas used', result.receipt.gasUsed);
    await expectEvent.inTransaction(result.tx, pair, 'Sync', {
      reserve0: token0Amount,
      reserve1: token1Amount
    });
    await expectEvent.inTransaction(result.tx, pair, 'Mint', {
      sender: router.address,
      amount0: token0Amount,
      amount1: token1Amount
    });
    // when call add Liquidity, the router will add token to the pool with the current ratio
    let updateAmount = Helper.expandTo18Decimals(2);
    let expectedToken0Amount = Helper.expandTo18Decimals(1).div(new BN(2));
    Helper.assertEqual(await router.quote(updateAmount, token1Amount, token0Amount), expectedToken0Amount);

    await expectRevert(
      router.addLiquidity(
        token0.address,
        token1.address,
        Helper.expandTo18Decimals(2),
        Helper.expandTo18Decimals(2),
        expectedToken0Amount.add(new BN(1)),
        0,
        trader,
        bigAmount,
        {from: trader}
      ),
      'XYZSwapRouter: INSUFFICIENT_A_AMOUNT'
    );

    result = await router.addLiquidity(
      token0.address,
      token1.address,
      Helper.expandTo18Decimals(2),
      Helper.expandTo18Decimals(2),
      0,
      0,
      trader,
      bigAmount,
      {from: trader}
    );
    await expectEvent.inTransaction(result.tx, pair, 'Mint', {
      sender: router.address,
      amount0: expectedToken0Amount,
      amount1: updateAmount
    });

    // similar test with token 1
    updateAmount = Helper.expandTo18Decimals(1);
    let expectedToken1Amount = Helper.expandTo18Decimals(4);
    Helper.assertEqual(await router.quote(updateAmount, token0Amount, token1Amount), expectedToken1Amount);
    await expectRevert(
      router.addLiquidity(
        token0.address,
        token1.address,
        updateAmount,
        Helper.expandTo18Decimals(5),
        0,
        expectedToken1Amount.add(new BN(1)),
        trader,
        bigAmount,
        {from: trader}
      ),
      'XYZSwapRouter: INSUFFICIENT_B_AMOUNT'
    );

    result = await router.addLiquidity(
      token0.address,
      token1.address,
      updateAmount,
      Helper.expandTo18Decimals(5),
      0,
      0,
      trader,
      bigAmount,
      {from: trader}
    );
    await expectEvent.inTransaction(result.tx, pair, 'Mint', {
      sender: router.address,
      amount0: updateAmount,
      amount1: expectedToken1Amount
    });
  });

  it('addLiquidity with ETH', async () => {
    const ethPartnerAmount = Helper.expandTo18Decimals(1);
    const ethAmount = Helper.expandTo18Decimals(4);

    const expectedLiquidity = Helper.expandTo18Decimals(2);
    const ethPairToken0 = await ethPair.token0();
    await ethPartner.approve(router.address, bigAmount, {from: trader});

    let result = await router.addLiquidity(
      ethPartner.address,
      ethAddress,
      ethPartnerAmount,
      ethAmount,
      ethPartnerAmount,
      ethAmount,
      trader,
      bigAmount,
      {from: trader, value: ethAmount}
    );
    console.log('gas used', result.receipt.gasUsed);
    await expectEvent.inTransaction(result.tx, ethPair, 'Sync', {
      reserve0: ethPairToken0 === ethPartner.address ? ethPartnerAmount : ethAmount,
      reserve1: ethPairToken0 === ethPartner.address ? ethAmount : ethPartnerAmount
    });
    await expectEvent.inTransaction(result.tx, pair, 'Mint', {
      sender: router.address,
      amount0: ethPairToken0 === ethPartner.address ? ethPartnerAmount : ethAmount,
      amount1: ethPairToken0 === ethPartner.address ? ethAmount : ethPartnerAmount
    });
    Helper.assertEqual(await ethPair.balanceOf(trader), expectedLiquidity.sub(MINIMUM_LIQUIDITY));
  });

  it('removeLiquidity', async () => {
    const token0Amount = Helper.expandTo18Decimals(1);
    const token1Amount = Helper.expandTo18Decimals(4);
    await token0.transfer(pair.address, token0Amount, {from: trader});
    await token1.transfer(pair.address, token1Amount, {from: trader});
    await pair.mint(trader);

    const expectedLiquidity = Helper.expandTo18Decimals(2);
    await pair.approve(router.address, bigAmount, {from: trader});
    // revert if amount is smaller than amountMin
    await expectRevert(
      router.removeLiquidity(
        token0.address,
        token1.address,
        expectedLiquidity.sub(MINIMUM_LIQUIDITY),
        token0Amount.sub(new BN(499)),
        0,
        trader,
        bigAmount,
        {from: trader}
      ),
      'XYZSwapRouter: INSUFFICIENT_A_AMOUNT'
    );

    await expectRevert(
      router.removeLiquidity(
        token0.address,
        token1.address,
        expectedLiquidity.sub(MINIMUM_LIQUIDITY),
        0,
        token1Amount.sub(new BN(1999)),
        trader,
        bigAmount,
        {from: trader}
      ),
      'XYZSwapRouter: INSUFFICIENT_B_AMOUNT'
    );

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
    console.log('gas used', result.receipt.gasUsed);
    await expectEvent.inTransaction(result.tx, pair, 'Sync', {
      reserve0: new BN(500),
      reserve1: new BN(2000)
    });
    await expectEvent.inTransaction(result.tx, pair, 'Burn', {
      sender: router.address,
      amount0: token0Amount.sub(new BN(500)),
      amount1: token1Amount.sub(new BN(2000)),
      to: trader
    });

    Helper.assertEqual(await pair.balanceOf(trader), new BN(0));
    Helper.assertEqual(await token0.balanceOf(trader), initTokenAmount.sub(new BN(500)));
    Helper.assertEqual(await token1.balanceOf(trader), initTokenAmount.sub(new BN(2000)));
  });

  it('removeLiquidity with ETH', async () => {
    const ethPartnerAmount = Helper.expandTo18Decimals(1);
    const ethAmount = Helper.expandTo18Decimals(4);

    await ethPartner.transfer(ethPair.address, ethPartnerAmount, {from: trader});
    await Helper.sendEtherWithPromise(trader, ethPair.address, ethAmount);
    await ethPair.mint(trader);

    const expectedLiquidity = Helper.expandTo18Decimals(2);
    const ethPairToken0 = await ethPair.token0();
    await ethPair.approve(router.address, bigAmount, {from: trader});
    let initEthAmount = await Helper.getBalancePromise(trader);
    let result = await router.removeLiquidity(
      ethAddress,
      ethPartner.address,
      expectedLiquidity.sub(MINIMUM_LIQUIDITY),
      0,
      0,
      trader,
      bigAmount,
      {from: trader, gasPrice: new BN(0)}
    );
    console.log('gas used', result.receipt.gasUsed);
    await expectEvent.inTransaction(result.tx, ethPair, 'Sync', {
      reserve0: ethPairToken0 === ethPartner.address ? new BN(500) : new BN(2000),
      reserve1: ethPairToken0 === ethPartner.address ? new BN(2000) : new BN(500)
    });

    await expectEvent.inTransaction(result.tx, ethPair, 'Burn', {
      sender: router.address,
      amount0: ethPairToken0 === ethPartner.address ? ethPartnerAmount.sub(new BN(500)) : ethAmount.sub(new BN(2000)),
      amount1: ethPairToken0 === ethPartner.address ? ethAmount.sub(new BN(2000)) : ethPartnerAmount.sub(new BN(500)),
      to: trader
    });
    Helper.assertEqual(await ethPair.balanceOf(trader), new BN(0));
    Helper.assertEqual(await ethPartner.balanceOf(trader), initTokenAmount.sub(new BN(500)));
    Helper.assertEqual(await Helper.getBalancePromise(trader), initEthAmount.add(ethAmount).sub(new BN(2000)));
  });

  it('swapETHForExactTokens', async () => {
    const ethPartnerAmount = Helper.expandTo18Decimals(10);
    const ethAmount = Helper.expandTo18Decimals(5);
    const outputAmount = Helper.expandTo18Decimals(1);
    const swapAmount = new BN('565227237267357629');
    // init pair
    await ethPartner.transfer(ethPair.address, ethPartnerAmount);
    await Helper.sendEtherWithPromise(trader, ethPair.address, ethAmount);
    await ethPair.mint(trader);

    const ethPairToken0 = await ethPair.token0();
    let tradeInfo = await ethPair.getTradeInfo();
    let reserveIn = ethPairToken0 == ethPartner.address ? tradeInfo._reserve1 : tradeInfo._reserve0;
    let reserveOut = ethPairToken0 == ethPartner.address ? tradeInfo._reserve0 : tradeInfo._reserve1;
    let expectAmountIn = await router.getAmountIn(outputAmount, reserveIn, reserveOut, tradeInfo.feeInPrecision);
    let ethBalance = await Helper.getBalancePromise(trader);

    let result = await router.swapTokensForExactTokens(
      outputAmount,
      swapAmount,
      [ethAddress, ethPartner.address],
      trader,
      bigAmount,
      {
        from: trader,
        value: swapAmount,
        gasPrice: new BN(0)
      }
    );
    console.log('gas used', result.receipt.gasUsed);

    await expectEvent.inTransaction(result.tx, ethPair, 'Swap', {
      sender: router.address,
      amount0In: ethPairToken0 === ethPartner.address ? new BN(0) : expectAmountIn,
      amount1In: ethPairToken0 === ethPartner.address ? expectAmountIn : new BN(0),
      amount0Out: ethPairToken0 === ethPartner.address ? outputAmount : new BN(0),
      amount1Out: ethPairToken0 === ethPartner.address ? new BN(0) : outputAmount,
      to: trader
    });

    await expectEvent.inTransaction(result.tx, ethPair, 'Sync', {
      reserve0:
        ethPairToken0 === ethPartner.address ? ethPartnerAmount.sub(outputAmount) : ethAmount.add(expectAmountIn),
      reserve1:
        ethPairToken0 === ethPartner.address ? ethAmount.add(expectAmountIn) : ethPartnerAmount.sub(outputAmount)
    });

    Helper.assertEqual(await ethPartner.balanceOf(trader), initTokenAmount.add(outputAmount));
    Helper.assertEqual(await Helper.getBalancePromise(trader), ethBalance.sub(expectAmountIn));
  });

  it('swapExactTokensForETH', async () => {
    const ethPartnerAmount = Helper.expandTo18Decimals(5);
    const ethAmount = Helper.expandTo18Decimals(10);
    const swapAmount = Helper.expandTo18Decimals(1);

    await ethPartner.transfer(ethPair.address, ethPartnerAmount);
    await Helper.sendEtherWithPromise(trader, ethPair.address, ethAmount);
    await ethPair.mint(trader);

    const ethPairToken0 = await ethPair.token0();
    let tradeInfo = await ethPair.getTradeInfo();
    let reserveOut = ethPairToken0 == ethPartner.address ? tradeInfo._reserve1 : tradeInfo._reserve0;
    let reserveIn = ethPairToken0 == ethPartner.address ? tradeInfo._reserve0 : tradeInfo._reserve1;
    let expectAmountOut = await router.getAmountOut(swapAmount, reserveIn, reserveOut, tradeInfo.feeInPrecision);

    await ethPartner.approve(router.address, bigAmount, {from: trader});
    let ethBalance = await Helper.getBalancePromise(trader);

    let result = await router.swapExactTokensForTokens(
      swapAmount,
      0,
      [ethPartner.address, ethAddress],
      trader,
      bigAmount,
      {
        from: trader,
        gasPrice: new BN(0)
      }
    );
    console.log('gas used', result.receipt.gasUsed);

    await expectEvent.inTransaction(result.tx, ethPair, 'Sync', {
      reserve0:
        ethPairToken0 === ethPartner.address ? ethPartnerAmount.add(swapAmount) : ethAmount.sub(expectAmountOut),
      reserve1:
        ethPairToken0 === ethPartner.address ? ethAmount.sub(expectAmountOut) : ethPartnerAmount.add(swapAmount)
    });
    await expectEvent.inTransaction(result.tx, ethPair, 'Swap', {
      sender: router.address,
      amount0In: ethPairToken0 === ethPartner.address ? swapAmount : new BN(0),
      amount1In: ethPairToken0 === ethPartner.address ? new BN(0) : swapAmount,
      amount0Out: ethPairToken0 === ethPartner.address ? new BN(0) : expectAmountOut,
      amount1Out: ethPairToken0 === ethPartner.address ? expectAmountOut : new BN(0),
      to: trader
    });

    Helper.assertEqual(await ethPartner.balanceOf(trader), initTokenAmount.sub(swapAmount));
    Helper.assertEqual(await Helper.getBalancePromise(trader), ethBalance.add(expectAmountOut));
  });

  it('swapTokensForExactETH', async () => {
    const ethPartnerAmount = Helper.expandTo18Decimals(5);
    const ethAmount = Helper.expandTo18Decimals(10);
    const outputAmount = Helper.expandTo18Decimals(1);

    await ethPartner.transfer(ethPair.address, ethPartnerAmount);
    await Helper.sendEtherWithPromise(trader, ethPair.address, ethAmount);
    await ethPair.mint(trader, {from: trader});

    await ethPartner.approve(router.address, bigAmount, {from: trader});
    const ethPairToken0 = await ethPair.token0();

    let tradeInfo = await ethPair.getTradeInfo();
    let reserveIn = ethPairToken0 == ethPartner.address ? tradeInfo._reserve0 : tradeInfo._reserve1;
    let reserveOut = ethPairToken0 == ethPartner.address ? tradeInfo._reserve1 : tradeInfo._reserve0;
    let expectAmountIn = await router.getAmountIn(outputAmount, reserveIn, reserveOut, tradeInfo.feeInPrecision);

    let ethBalance = await Helper.getBalancePromise(trader);

    let result = await router.swapTokensForExactTokens(
      outputAmount,
      bigAmount,
      [ethPartner.address, ethAddress],
      trader,
      bigAmount,
      {
        from: trader,
        gasPrice: new BN(0)
      }
    );
    console.log('gas used', result.receipt.gasUsed);

    await expectEvent.inTransaction(result.tx, ethPair, 'Sync', {
      reserve0:
        ethPairToken0 === ethPartner.address ? ethPartnerAmount.add(expectAmountIn) : ethAmount.sub(outputAmount),
      reserve1:
        ethPairToken0 === ethPartner.address ? ethAmount.sub(outputAmount) : ethPartnerAmount.add(expectAmountIn)
    });
    await expectEvent.inTransaction(result.tx, ethPair, 'Swap', {
      sender: router.address,
      amount0In: ethPairToken0 === ethPartner.address ? expectAmountIn : new BN(0),
      amount1In: ethPairToken0 === ethPartner.address ? new BN(0) : expectAmountIn,
      amount0Out: ethPairToken0 === ethPartner.address ? new BN(0) : outputAmount,
      amount1Out: ethPairToken0 === ethPartner.address ? outputAmount : new BN(0),
      to: trader
    });

    Helper.assertEqual(await ethPartner.balanceOf(trader), initTokenAmount.sub(expectAmountIn));
    Helper.assertEqual(await Helper.getBalancePromise(trader), ethBalance.add(outputAmount));
  });

  it('swapExactETHForTokens', async () => {
    const ethPartnerAmount = Helper.expandTo18Decimals(10);
    const ethAmount = Helper.expandTo18Decimals(5);
    const swapAmount = Helper.expandTo18Decimals(1);

    await ethPartner.transfer(ethPair.address, ethPartnerAmount);
    await Helper.sendEtherWithPromise(trader, ethPair.address, ethAmount);
    await ethPair.mint(trader);

    await token0.approve(router.address, bigAmount, {from: trader});

    const ethPairToken0 = await ethPair.token0();

    let tradeInfo = await ethPair.getTradeInfo();
    let reserveOut = ethPairToken0 == ethPartner.address ? tradeInfo._reserve0 : tradeInfo._reserve1;
    let reserveIn = ethPairToken0 == ethPartner.address ? tradeInfo._reserve1 : tradeInfo._reserve0;
    let expectedOutputAmount = await router.getAmountOut(swapAmount, reserveIn, reserveOut, tradeInfo.feeInPrecision);

    let ethBalance = await Helper.getBalancePromise(trader);

    let result = await router.swapExactTokensForTokens(
      swapAmount,
      0,
      [ethAddress, ethPartner.address],
      trader,
      bigAmount,
      {
        from: trader,
        value: swapAmount,
        gasPrice: 0
      }
    );
    console.log('gas used', result.receipt.gasUsed);

    await expectEvent.inTransaction(result.tx, ethPair, 'Sync', {
      reserve0:
        ethPairToken0 === ethPartner.address ? ethPartnerAmount.sub(expectedOutputAmount) : ethAmount.add(swapAmount),
      reserve1:
        ethPairToken0 === ethPartner.address ? ethAmount.add(swapAmount) : ethPartnerAmount.sub(expectedOutputAmount)
    });
    await expectEvent.inTransaction(result.tx, ethPair, 'Swap', {
      sender: router.address,
      amount0In: ethPairToken0 === ethPartner.address ? new BN(0) : swapAmount,
      amount1In: ethPairToken0 === ethPartner.address ? swapAmount : new BN(0),
      amount0Out: ethPairToken0 === ethPartner.address ? expectedOutputAmount : new BN(0),
      amount1Out: ethPairToken0 === ethPartner.address ? new BN(0) : expectedOutputAmount,
      to: trader
    });

    Helper.assertEqual(await ethPartner.balanceOf(trader), initTokenAmount.add(expectedOutputAmount));
    Helper.assertEqual(await Helper.getBalancePromise(trader), ethBalance.sub(swapAmount));
  });

  it('swapExactTokensForTokens', async () => {
    const token0Amount = Helper.expandTo18Decimals(5);
    const token1Amount = Helper.expandTo18Decimals(10);
    const swapAmount = Helper.expandTo18Decimals(1);
    const path = [token0.address, token1.address];

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
    let amountsOut = await router.getAmountsOut(swapAmount, path);
    Helper.assertEqual(amountsOut[1], expectedOutputAmount);
    // revert if amountDesired < amountOut
    await expectRevert(
      router.swapExactTokensForTokens(swapAmount, expectedOutputAmount.add(new BN(1)), path, trader, bigAmount, {
        from: trader
      }),
      'XYZSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT'
    );

    // revert if over deadline
    let expiredTimeStamp = (await Helper.getCurrentBlockTime()) - 1;
    await expectRevert(
      router.swapExactTokensForTokens(swapAmount, 0, path, trader, expiredTimeStamp, {from: trader}),
      'XYZSwapRouter: EXPIRED'
    );

    let result = await router.swapExactTokensForTokens(swapAmount, 0, path, trader, bigAmount, {from: trader});
    console.log('gas used', result.receipt.gasUsed);

    await expectEvent.inTransaction(result.tx, pair, 'Sync', {
      reserve0: token0Amount.add(swapAmount),
      reserve1: token1Amount.sub(expectedOutputAmount)
    });
    await expectEvent.inTransaction(result.tx, pair, 'Swap', {
      sender: router.address,
      amount0In: swapAmount,
      amount1In: new BN(0),
      amount0Out: new BN(0),
      amount1Out: expectedOutputAmount,
      to: trader
    });

    Helper.assertEqual(await token0.balanceOf(trader), initTokenAmount.sub(swapAmount));
    Helper.assertEqual(await token1.balanceOf(trader), initTokenAmount.add(expectedOutputAmount));
  });

  it('swapTokensForExactTokens', async () => {
    const token0Amount = Helper.expandTo18Decimals(5);
    const token1Amount = Helper.expandTo18Decimals(10);
    const outputAmount = Helper.expandTo18Decimals(1);
    const path = [token0.address, token1.address];

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
    let amountsIn = await router.getAmountsIn(outputAmount, path);
    Helper.assertEqual(amountsIn[0], expectedSwapAmount);
    // revert if amountDesired > amountIn
    await expectRevert(
      router.swapTokensForExactTokens(outputAmount, expectedSwapAmount.sub(new BN(1)), path, trader, bigAmount, {
        from: trader
      }),
      'XYZSwapRouter: EXCESSIVE_INPUT_AMOUNT'
    );
    // revert if over deadline
    let expiredTimeStamp = (await Helper.getCurrentBlockTime()) - 1;
    await expectRevert(
      router.swapTokensForExactTokens(outputAmount, bigAmount, path, trader, expiredTimeStamp, {
        from: trader
      }),
      'XYZSwapRouter: EXPIRED'
    );

    let result = await router.swapTokensForExactTokens(outputAmount, bigAmount, path, trader, bigAmount, {
      from: trader
    });

    await expectEvent.inTransaction(result.tx, pair, 'Sync', {
      reserve0: token0Amount.add(expectedSwapAmount),
      reserve1: token1Amount.sub(outputAmount)
    });

    await expectEvent.inTransaction(result.tx, pair, 'Swap', {
      sender: router.address,
      amount0In: expectedSwapAmount,
      amount1In: new BN(0),
      amount0Out: new BN(0),
      amount1Out: outputAmount,
      to: trader
    });

    Helper.assertEqual(await token0.balanceOf(trader), initTokenAmount.sub(expectedSwapAmount));
    Helper.assertEqual(await token1.balanceOf(trader), initTokenAmount.add(outputAmount));
  });
});
