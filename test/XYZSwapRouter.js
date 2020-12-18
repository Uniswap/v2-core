const Helper = require('./helper');
const BN = web3.utils.BN;

const {precisionUnits, MINIMUM_LIQUIDITY} = require('./helper');
const {expectEvent, expectRevert, time} = require('@openzeppelin/test-helpers');
const {ecsign} = require('ethereumjs-util');

const XYZSwapRouter = artifacts.require('XYZSwapRouter02');
const XYZSwapFactory = artifacts.require('XYZSwapFactory');
const WETH = artifacts.require('WETH9');
const XYZSwapPair = artifacts.require('XYZSwapPair');
const TestToken = artifacts.require('TestToken');

const bigAmount = new BN(2).pow(new BN(250));

let trader;
let feeTo;
let liquidityProvider;
let liquidityProviderPkKey;
let app;
let factory;
let token0;
let token1;
let ethPartner;
let ethPair;
let weth;

let router;
let pair;
let initTokenAmount = Helper.expandTo18Decimals(1000);
const BNOne = new BN(1);
const MaxUint256 = new BN(2).pow(new BN(256)).sub(BNOne);

contract('XYZSwapRouter', function (accounts) {
  beforeEach('setup', async () => {
    trader = accounts[1];
    app = accounts[2];
    liquidityProvider = accounts[3];
    // key from hardhat.config.js
    liquidityProviderPkKey = '0xee9d129c1997549ee09c0757af5939b2483d80ad649a0eda68e8b0357ad11131';
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
    weth = await WETH.new();
    await ethPartner.transfer(trader, initTokenAmount);
    await factory.createPair(weth.address, ethPartner.address);
    const wethPairAddress = await factory.getPair(weth.address, ethPartner.address);
    ethPair = await XYZSwapPair.at(wethPairAddress);

    router = await XYZSwapRouter.new(factory.address, weth.address);
  });

  it('factory, ETH', async () => {
    Helper.assertEqual(await router.factory(), factory.address);
    Helper.assertEqual(await router.weth(), weth.address);
  });

  it('addLiquidity with pair is not created', async () => {
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

    await expectRevert(
      router.addLiquidity(
        token1.address,
        token0.address,
        Helper.expandTo18Decimals(2),
        Helper.expandTo18Decimals(2),
        0,
        expectedToken0Amount.add(new BN(1)),
        trader,
        bigAmount,
        {from: trader}
      ),
      'XYZSwapRouter: INSUFFICIENT_B_AMOUNT'
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

    await expectRevert(
      router.addLiquidity(
        token1.address,
        token0.address,
        Helper.expandTo18Decimals(5),
        updateAmount,
        expectedToken1Amount.add(new BN(1)),
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

  it('addLiquidityETH', async () => {
    const ethPartnerAmount = Helper.expandTo18Decimals(1);
    const ethAmount = Helper.expandTo18Decimals(4);

    const expectedLiquidity = Helper.expandTo18Decimals(2);
    const ethPairToken0 = await ethPair.token0();
    await ethPartner.approve(router.address, bigAmount, {from: trader});

    let result = await router.addLiquidityETH(
      ethPartner.address,
      ethPartnerAmount,
      ethPartnerAmount,
      ethAmount,
      trader,
      bigAmount,
      {from: trader, value: ethAmount}
    );
    console.log('addLiquidityETH 1st time: gas used', result.receipt.gasUsed);
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

    // test add Liquidity with extra ETH should return to sender
    result = await router.addLiquidityETH(
      ethPartner.address,
      ethPartnerAmount,
      ethPartnerAmount,
      ethAmount,
      trader,
      bigAmount,
      {from: trader, value: ethAmount.add(new BN(100))}
    );
    await expectEvent.inTransaction(result.tx, pair, 'Mint', {
      sender: router.address,
      amount0: ethPairToken0 === ethPartner.address ? ethPartnerAmount : ethAmount,
      amount1: ethPairToken0 === ethPartner.address ? ethAmount : ethPartnerAmount
    });
    Helper.assertEqual(await ethPair.balanceOf(trader), expectedLiquidity.mul(new BN(2)).sub(MINIMUM_LIQUIDITY));

    // test add Liquidity with extra token
    result = await router.addLiquidityETH(
      ethPartner.address,
      ethPartnerAmount.add(new BN(500)),
      ethPartnerAmount,
      ethAmount,
      trader,
      bigAmount,
      {from: trader, value: ethAmount}
    );
    console.log('addLiquidityETH 2nd time: gas used', result.receipt.gasUsed);
    await expectEvent.inTransaction(result.tx, pair, 'Mint', {
      sender: router.address,
      amount0: ethPairToken0 === ethPartner.address ? ethPartnerAmount : ethAmount,
      amount1: ethPairToken0 === ethPartner.address ? ethAmount : ethPartnerAmount
    });
    Helper.assertEqual(await ethPair.balanceOf(trader), expectedLiquidity.mul(new BN(3)).sub(MINIMUM_LIQUIDITY));
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
        token1.address,
        token0.address,
        expectedLiquidity.sub(MINIMUM_LIQUIDITY),
        0,
        token0Amount.sub(new BN(499)),
        trader,
        bigAmount,
        {from: trader}
      ),
      'XYZSwapRouter: INSUFFICIENT_B_AMOUNT'
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

  it('removeLiquidityETH', async () => {
    const ethPartnerAmount = Helper.expandTo18Decimals(1);
    const ethAmount = Helper.expandTo18Decimals(4);

    await ethPartner.transfer(ethPair.address, ethPartnerAmount, {from: trader});
    await weth.deposit({value: ethAmount});
    await weth.transfer(ethPair.address, ethAmount);
    await ethPair.mint(trader);

    const expectedLiquidity = Helper.expandTo18Decimals(2);
    const ethPairToken0 = await ethPair.token0();
    await ethPair.approve(router.address, bigAmount, {from: trader});
    let initEthAmount = await Helper.getBalancePromise(trader);
    let result = await router.removeLiquidityETH(
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
      to: router.address
    });
    Helper.assertEqual(await ethPair.balanceOf(trader), new BN(0));
    Helper.assertEqual(await ethPartner.balanceOf(trader), initTokenAmount.sub(new BN(500)));
    Helper.assertEqual(await Helper.getBalancePromise(trader), initEthAmount.add(ethAmount).sub(new BN(2000)));
  });

  it('removeLiquidityWithPermit', async () => {
    const token0Amount = Helper.expandTo18Decimals(1);
    const token1Amount = Helper.expandTo18Decimals(4);
    await token0.transfer(pair.address, token0Amount, {from: trader});
    await token1.transfer(pair.address, token1Amount, {from: trader});
    await pair.mint(liquidityProvider);
    const expectedLiquidity = Helper.expandTo18Decimals(2);

    let nonce = await pair.nonces(liquidityProvider);
    let digest = await Helper.getApprovalDigest(
      pair,
      liquidityProvider,
      router.address,
      expectedLiquidity.sub(MINIMUM_LIQUIDITY),
      nonce,
      MaxUint256
    );
    let signature = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(liquidityProviderPkKey.slice(2), 'hex'));

    const beforeBalance0 = await token0.balanceOf(liquidityProvider);
    const beforeBalance1 = await token1.balanceOf(liquidityProvider);
    let result = await router.removeLiquidityWithPermit(
      token0.address,
      token1.address,
      expectedLiquidity.sub(MINIMUM_LIQUIDITY),
      0,
      0,
      liquidityProvider,
      MaxUint256, /// deadline
      false, /// approveMax
      signature.v,
      signature.r,
      signature.s,
      {from: liquidityProvider}
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
      to: liquidityProvider
    });

    Helper.assertEqual(await pair.nonces(liquidityProvider), new BN(1));
    Helper.assertEqual(await pair.balanceOf(liquidityProvider), new BN(0));
    Helper.assertEqual(await token0.balanceOf(liquidityProvider), beforeBalance0.add(token0Amount).sub(new BN(500)));
    Helper.assertEqual(await token1.balanceOf(liquidityProvider), beforeBalance1.add(token1Amount).sub(new BN(2000)));

    // test remove liquidity with approve max
    await token0.transfer(pair.address, token0Amount, {from: trader});
    await token1.transfer(pair.address, token1Amount, {from: trader});
    await pair.mint(liquidityProvider);

    let liquidity = await pair.balanceOf(liquidityProvider);

    nonce = await pair.nonces(liquidityProvider);
    digest = await Helper.getApprovalDigest(pair, liquidityProvider, router.address, MaxUint256, nonce, MaxUint256);

    signature = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(liquidityProviderPkKey.slice(2), 'hex'));

    await router.removeLiquidityWithPermit(
      token0.address,
      token1.address,
      liquidity,
      0,
      0,
      liquidityProvider,
      MaxUint256, /// deadline
      true, /// approveMax
      signature.v,
      signature.r,
      signature.s,
      {from: liquidityProvider}
    );
  });

  it('removeLiquidityETHWithPermit', async () => {
    const ethPartnerAmount = Helper.expandTo18Decimals(1);
    const ethAmount = Helper.expandTo18Decimals(4);
    await ethPartner.transfer(ethPair.address, ethPartnerAmount, {from: trader});
    await weth.deposit({value: ethAmount});
    await weth.transfer(ethPair.address, ethAmount);
    await ethPair.mint(liquidityProvider);
    const expectedLiquidity = Helper.expandTo18Decimals(2);
    const ethPairToken0 = await ethPair.token0();

    const nonce = await ethPair.nonces(trader);
    const digest = await Helper.getApprovalDigest(
      ethPair,
      liquidityProvider,
      router.address,
      expectedLiquidity.sub(MINIMUM_LIQUIDITY),
      nonce,
      MaxUint256
    );
    const {v, r, s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(liquidityProviderPkKey.slice(2), 'hex'));

    const beforeTokenBalance = await ethPartner.balanceOf(liquidityProvider);
    const beforeEthBalance = await Helper.getBalancePromise(liquidityProvider);
    let result = await router.removeLiquidityETHWithPermit(
      ethPartner.address,
      expectedLiquidity.sub(MINIMUM_LIQUIDITY),
      0,
      0,
      liquidityProvider,
      MaxUint256, /// deadline
      false, /// approveMax
      v,
      r,
      s,
      {from: liquidityProvider, gasPrice: new BN(0)} // because we calculate the balance after trade so gas price should be 0
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
      to: router.address
    });

    Helper.assertEqual(await pair.balanceOf(liquidityProvider), new BN(0));
    Helper.assertEqual(
      await ethPartner.balanceOf(liquidityProvider),
      beforeTokenBalance.add(ethPartnerAmount).sub(new BN(500))
    );
    Helper.assertEqual(
      await Helper.getBalancePromise(liquidityProvider),
      beforeEthBalance.add(ethAmount).sub(new BN(2000))
    );
  });

  it('swapETHForExactTokens', async () => {
    let ethPartnerAmount = Helper.expandTo18Decimals(10);
    let ethAmount = Helper.expandTo18Decimals(5);
    const outputAmount = Helper.expandTo18Decimals(1);
    const swapAmount = new BN('565227237267357629');
    // init pair
    await ethPartner.transfer(ethPair.address, ethPartnerAmount);
    await weth.deposit({value: ethAmount});
    await weth.transfer(ethPair.address, ethAmount);
    await ethPair.mint(trader);

    const ethPairToken0 = await ethPair.token0();
    let tradeInfo = await ethPair.getTradeInfo();
    let expectAmountIn = await router.getAmountIn(outputAmount, ethAmount, ethPartnerAmount, tradeInfo.feeInPrecision);
    // update amount
    ethAmount = ethAmount.add(expectAmountIn);
    ethPartnerAmount = ethPartnerAmount.sub(outputAmount);

    let tokenBalance = await ethPartner.balanceOf(trader);
    let ethBalance = await Helper.getBalancePromise(trader);
    const path = [weth.address, ethPartner.address];
    // revert if invalid path
    await expectRevert(
      router.swapETHForExactTokens(outputAmount, [token0.address, ethPartner.address], trader, bigAmount, {
        from: trader,
        value: swapAmount,
        gasPrice: new BN(0)
      }),
      'XYZSwapRouter: INVALID_PATH'
    );
    // revert if excessive input amount
    await expectRevert(
      router.swapETHForExactTokens(outputAmount, path, trader, bigAmount, {
        from: trader,
        value: expectAmountIn.sub(new BN(1)),
        gasPrice: new BN(0)
      }),
      'XYZSwapRouter: EXCESSIVE_INPUT_AMOUNT'
    );

    result = await router.swapETHForExactTokens(outputAmount, path, trader, bigAmount, {
      from: trader,
      value: swapAmount,
      gasPrice: new BN(0)
    });
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
      reserve0: ethPairToken0 === ethPartner.address ? ethPartnerAmount : ethAmount,
      reserve1: ethPairToken0 === ethPartner.address ? ethAmount : ethPartnerAmount
    });

    Helper.assertEqual(await ethPartner.balanceOf(trader), tokenBalance.add(outputAmount));
    Helper.assertEqual(await Helper.getBalancePromise(trader), ethBalance.sub(expectAmountIn));

    // edge case not refund dust eth if msg.value = amounts[0]
    await time.advanceBlock();
    tradeInfo = await ethPair.getTradeInfo();
    expectAmountIn = await router.getAmountIn(
      outputAmount,
      ethPairToken0 === weth.address ? tradeInfo._reserve0 : tradeInfo._reserve1, // reserveIn
      ethPairToken0 === weth.address ? tradeInfo._reserve1 : tradeInfo._reserve0, // reserveOut
      tradeInfo.feeInPrecision
    );

    result = await router.swapETHForExactTokens(outputAmount, path, trader, bigAmount, {
      from: trader,
      value: expectAmountIn,
      gasPrice: new BN(0)
    });
    console.log('gas used', result.receipt.gasUsed);
  });

  it('swapExactTokensForETH', async () => {
    let ethPartnerAmount = Helper.expandTo18Decimals(5);
    let ethAmount = Helper.expandTo18Decimals(10);
    const swapAmount = Helper.expandTo18Decimals(1);

    await ethPartner.transfer(ethPair.address, ethPartnerAmount);
    await weth.deposit({value: ethAmount});
    await weth.transfer(ethPair.address, ethAmount);
    await ethPair.mint(trader);

    const ethPairToken0 = await ethPair.token0();
    let tradeInfo = await ethPair.getTradeInfo();
    let expectAmountOut = await router.getAmountOut(swapAmount, ethPartnerAmount, ethAmount, tradeInfo.feeInPrecision);

    await ethPartner.approve(router.address, bigAmount, {from: trader});
    let ethBalance = await Helper.getBalancePromise(trader);
    const path = [ethPartner.address, weth.address];

    await expectRevert(
      router.swapExactTokensForETH(swapAmount, 0, [ethPartner.address, token0.address], trader, bigAmount, {
        from: trader,
        gasPrice: new BN(0)
      }),
      'XYZSwapRouter: INVALID_PATH'
    );
    await expectRevert(
      router.swapExactTokensForETH(swapAmount, expectAmountOut.add(BNOne), path, trader, bigAmount, {
        from: trader,
        gasPrice: new BN(0)
      }),
      'XYZSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT'
    );
    let result = await router.swapExactTokensForETH(swapAmount, 0, path, trader, bigAmount, {
      from: trader,
      gasPrice: new BN(0)
    });
    console.log('gas used', result.receipt.gasUsed);

    ethPartnerAmount = ethPartnerAmount.add(swapAmount);
    ethAmount = ethAmount.sub(expectAmountOut);
    await expectEvent.inTransaction(result.tx, ethPair, 'Sync', {
      reserve0: ethPairToken0 === ethPartner.address ? ethPartnerAmount : ethAmount,
      reserve1: ethPairToken0 === ethPartner.address ? ethAmount : ethPartnerAmount
    });
    await expectEvent.inTransaction(result.tx, ethPair, 'Swap', {
      sender: router.address,
      amount0In: ethPairToken0 === ethPartner.address ? swapAmount : new BN(0),
      amount1In: ethPairToken0 === ethPartner.address ? new BN(0) : swapAmount,
      amount0Out: ethPairToken0 === ethPartner.address ? new BN(0) : expectAmountOut,
      amount1Out: ethPairToken0 === ethPartner.address ? expectAmountOut : new BN(0),
      to: router.address
    });

    Helper.assertEqual(await ethPartner.balanceOf(trader), initTokenAmount.sub(swapAmount));
    Helper.assertEqual(await Helper.getBalancePromise(trader), ethBalance.add(expectAmountOut));
  });

  it('swapTokensForExactETH', async () => {
    let ethPartnerAmount = Helper.expandTo18Decimals(5);
    let ethAmount = Helper.expandTo18Decimals(10);
    const outputAmount = Helper.expandTo18Decimals(1);
    const path = [ethPartner.address, weth.address];

    await ethPartner.transfer(ethPair.address, ethPartnerAmount);
    await weth.deposit({value: ethAmount});
    await weth.transfer(ethPair.address, ethAmount);
    await ethPair.mint(trader, {from: trader});

    await ethPartner.approve(router.address, bigAmount, {from: trader});
    const ethPairToken0 = await ethPair.token0();

    let tradeInfo = await ethPair.getTradeInfo();
    let reserveIn = ethPairToken0 == ethPartner.address ? tradeInfo._reserve0 : tradeInfo._reserve1;
    let reserveOut = ethPairToken0 == ethPartner.address ? tradeInfo._reserve1 : tradeInfo._reserve0;
    let expectAmountIn = await router.getAmountIn(outputAmount, reserveIn, reserveOut, tradeInfo.feeInPrecision);

    let ethBalance = await Helper.getBalancePromise(trader);

    await expectRevert(
      router.swapTokensForExactETH(outputAmount, bigAmount, [ethPartner.address, token0.address], trader, bigAmount, {
        from: trader,
        gasPrice: new BN(0)
      }),
      'XYZSwapRouter: INVALID_PATH'
    );

    await expectRevert(
      router.swapTokensForExactETH(outputAmount, expectAmountIn.sub(BNOne), path, trader, bigAmount, {
        from: trader,
        gasPrice: new BN(0)
      }),
      'XYZSwapRouter: EXCESSIVE_INPUT_AMOUNT'
    );
    let result = await router.swapTokensForExactETH(outputAmount, bigAmount, path, trader, bigAmount, {
      from: trader,
      gasPrice: new BN(0)
    });
    console.log('gas used', result.receipt.gasUsed);

    ethAmount = ethAmount.sub(outputAmount);
    ethPartnerAmount = ethPartnerAmount.add(expectAmountIn);
    await expectEvent.inTransaction(result.tx, ethPair, 'Sync', {
      reserve0: ethPairToken0 === ethPartner.address ? ethPartnerAmount : ethAmount,
      reserve1: ethPairToken0 === ethPartner.address ? ethAmount : ethPartnerAmount
    });
    await expectEvent.inTransaction(result.tx, ethPair, 'Swap', {
      sender: router.address,
      amount0In: ethPairToken0 === ethPartner.address ? expectAmountIn : new BN(0),
      amount1In: ethPairToken0 === ethPartner.address ? new BN(0) : expectAmountIn,
      amount0Out: ethPairToken0 === ethPartner.address ? new BN(0) : outputAmount,
      amount1Out: ethPairToken0 === ethPartner.address ? outputAmount : new BN(0),
      to: router.address
    });

    Helper.assertEqual(await ethPartner.balanceOf(trader), initTokenAmount.sub(expectAmountIn));
    Helper.assertEqual(await Helper.getBalancePromise(trader), ethBalance.add(outputAmount));
  });

  it('swapExactETHForTokens', async () => {
    let ethPartnerAmount = Helper.expandTo18Decimals(10);
    let ethAmount = Helper.expandTo18Decimals(5);
    const swapAmount = Helper.expandTo18Decimals(1);
    const path = [weth.address, ethPartner.address];

    await ethPartner.transfer(ethPair.address, ethPartnerAmount);
    await weth.deposit({value: ethAmount});
    await weth.transfer(ethPair.address, ethAmount);
    await ethPair.mint(trader);

    await token0.approve(router.address, bigAmount, {from: trader});

    const ethPairToken0 = await ethPair.token0();

    let tradeInfo = await ethPair.getTradeInfo();
    let reserveOut = ethPairToken0 == ethPartner.address ? tradeInfo._reserve0 : tradeInfo._reserve1;
    let reserveIn = ethPairToken0 == ethPartner.address ? tradeInfo._reserve1 : tradeInfo._reserve0;
    let expectedOutputAmount = await router.getAmountOut(swapAmount, reserveIn, reserveOut, tradeInfo.feeInPrecision);

    let ethBalance = await Helper.getBalancePromise(trader);

    await expectRevert(
      router.swapExactETHForTokens(0, [token0.address, ethPartner.address], trader, bigAmount, {
        from: trader,
        value: swapAmount,
        gasPrice: 0
      }),
      'XYZSwapRouter: INVALID_PATH'
    );
    await expectRevert(
      router.swapExactETHForTokens(expectedOutputAmount.add(BNOne), path, trader, bigAmount, {
        from: trader,
        value: swapAmount,
        gasPrice: 0
      }),
      'XYZSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT'
    );
    let result = await router.swapExactETHForTokens(0, path, trader, bigAmount, {
      from: trader,
      value: swapAmount,
      gasPrice: 0
    });
    console.log('gas used', result.receipt.gasUsed);

    ethPartnerAmount = ethPartnerAmount.sub(expectedOutputAmount);
    ethAmount = ethAmount.add(swapAmount);
    await expectEvent.inTransaction(result.tx, ethPair, 'Sync', {
      reserve0: ethPairToken0 === ethPartner.address ? ethPartnerAmount : ethAmount,
      reserve1: ethPairToken0 === ethPartner.address ? ethAmount : ethPartnerAmount
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
