const Helper = require('../helper');
const dmmHelper = require('../dmmHelper');
const BN = web3.utils.BN;

const {precisionUnits, MINIMUM_LIQUIDITY} = require('../helper');
const {expectEvent, expectRevert, time} = require('@openzeppelin/test-helpers');
const {ecsign} = require('ethereumjs-util');

const DMMRouter = artifacts.require('DMMRouter02');
const DMMFactory = artifacts.require('DMMFactory');
const WETH = artifacts.require('WETH9');
const DMMPool = artifacts.require('DMMPool');
const TestToken = artifacts.require('TestToken');

const bigAmount = new BN(2).pow(new BN(250));

let trader;
let feeToSetter;
let feeTo;
let liquidityProvider;
let liquidityProviderPkKey;
let app;
let factory;
let token0;
let token1;
let ethPartner;
let ethPool;
let weth;

let router;
let pool;
let initTokenAmount = Helper.expandTo18Decimals(1000);
const BNOne = new BN(1);
const MaxUint256 = new BN(2).pow(new BN(256)).sub(BNOne);

contract('DMMRouter', function (accounts) {
  before('setup', async () => {
    feeToSetter = accounts[0];
    trader = accounts[1];
    app = accounts[2];
    liquidityProvider = accounts[3];
    // key from hardhat.config.js
    liquidityProviderPkKey = '0xee9d129c1997549ee09c0757af5939b2483d80ad649a0eda68e8b0357ad11131';
    feeTo = accounts[4];

    let tokenA = await TestToken.new('test token A', 'A', Helper.expandTo18Decimals(100000));
    let tokenB = await TestToken.new('test token B', 'B', Helper.expandTo18Decimals(100000));
    tokenA.transfer(trader, initTokenAmount);
    tokenB.transfer(trader, initTokenAmount);
    [token0, token1] = new BN(tokenA.address).lt(new BN(tokenB.address)) ? [tokenA, tokenB] : [tokenB, tokenA];

    weth = await WETH.new();
    ethPartner = await TestToken.new('WETH Partner', 'WETH-P', Helper.expandTo18Decimals(100000));
    await ethPartner.transfer(trader, initTokenAmount);
  });

  beforeEach('setup', async () => {
    factory = await DMMFactory.new(accounts[0]);
    /// create pool tokenA and tokenB
    await factory.createPool(token0.address, token1.address, new BN(10000));
    const poolAddrs = await factory.getPools(token0.address, token1.address);
    pool = await DMMPool.at(poolAddrs[0]);
    /// create pool weth and ethPartner
    await factory.createPool(weth.address, ethPartner.address, new BN(10000));
    const wethPoolAddresses = await factory.getPools(weth.address, ethPartner.address);
    ethPool = await DMMPool.at(wethPoolAddresses[0]);
    /// create router
    router = await DMMRouter.new(factory.address, weth.address);
  });

  it('factory, ETH', async () => {
    Helper.assertEqual(await router.factory(), factory.address);
    Helper.assertEqual(await router.weth(), weth.address);
  });

  describe('addLiquidity', async () => {
    it('addLiquidityNewPool', async () => {
      let tokenA = await TestToken.new('test token A', 'A', Helper.expandTo18Decimals(10000));
      let tokenB = await TestToken.new('test token B', 'B', Helper.expandTo18Decimals(10000));
      tokenA.transfer(trader, initTokenAmount);
      tokenB.transfer(trader, initTokenAmount);

      await tokenA.approve(router.address, bigAmount, {from: trader});
      await tokenB.approve(router.address, bigAmount, {from: trader});

      const tokenAAmount = Helper.expandTo18Decimals(1);
      const tokenBAmount = Helper.expandTo18Decimals(4);
      // amp-pool
      let result = await router.addLiquidityNewPool(
        tokenA.address,
        tokenB.address,
        new BN(20000),
        tokenAAmount,
        tokenBAmount,
        0,
        0,
        liquidityProvider,
        bigAmount,
        {from: trader}
      );
      let poolAddresses = await factory.getPools(tokenA.address, tokenB.address);
      let pool = await DMMPool.at(poolAddresses[0]);
      const token0Address = await pool.token0();
      console.log('gas used', result.receipt.gasUsed);
      await expectEvent.inTransaction(result.tx, pool, 'Sync', {
        reserve0: tokenA.address == token0Address ? tokenAAmount : tokenBAmount,
        reserve1: tokenA.address == token0Address ? tokenBAmount : tokenAAmount
      });
      const expectedLiquidity = Helper.sqrt(tokenAAmount.mul(tokenBAmount)).sub(MINIMUM_LIQUIDITY);
      Helper.assertEqual(await pool.balanceOf(liquidityProvider), expectedLiquidity, 'unexpected liquidity');

      // unamplified pool
      result = await router.addLiquidityNewPool(
        tokenB.address,
        tokenA.address,
        new BN(10000),
        tokenBAmount,
        tokenAAmount,
        0,
        0,
        liquidityProvider,
        bigAmount,
        {from: trader}
      );
      poolAddresses = await factory.getPools(tokenA.address, tokenB.address);
      pool = await DMMPool.at(poolAddresses[1]);
      await expectEvent.inTransaction(result.tx, pool, 'Sync', {
        reserve0: tokenA.address == token0Address ? tokenAAmount : tokenBAmount,
        reserve1: tokenA.address == token0Address ? tokenBAmount : tokenAAmount
      });
      Helper.assertEqual(await pool.balanceOf(liquidityProvider), expectedLiquidity, 'unexpected liquidity');
      // addliquidity for unamplified again
      result = await router.addLiquidityNewPool(
        tokenB.address,
        tokenA.address,
        new BN(10000),
        tokenBAmount,
        tokenAAmount,
        0,
        0,
        liquidityProvider,
        bigAmount,
        {from: trader}
      );
      poolAddresses = await factory.getPools(tokenA.address, tokenB.address);
      Helper.assertEqual(poolAddresses.length, 2);
    });

    it('addLiquidityNewPoolETH', async () => {
      let token = await TestToken.new('test token A', 'A', Helper.expandTo18Decimals(10000));
      token.transfer(trader, initTokenAmount);

      await token.approve(router.address, bigAmount, {from: trader});

      const tokenAmount = Helper.expandTo18Decimals(1);
      const ethAmount = Helper.expandTo18Decimals(4);
      // amp-pool
      let result = await router.addLiquidityNewPoolETH(
        token.address,
        new BN(20000),
        tokenAmount,
        0,
        0,
        liquidityProvider,
        bigAmount,
        {from: trader, value: ethAmount}
      );
      let poolAddresses = await factory.getPools(token.address, weth.address);
      let pool = await DMMPool.at(poolAddresses[0]);
      const token0Address = await pool.token0();
      console.log('gas used', result.receipt.gasUsed);
      await expectEvent.inTransaction(result.tx, pool, 'Sync', {
        reserve0: token.address == token0Address ? tokenAmount : ethAmount,
        reserve1: token.address == token0Address ? ethAmount : tokenAmount
      });
      const expectedLiquidity = Helper.sqrt(tokenAmount.mul(ethAmount)).sub(MINIMUM_LIQUIDITY);
      Helper.assertEqual(await pool.balanceOf(liquidityProvider), expectedLiquidity, 'unexpected liquidity');

      // unamplified pool
      result = await router.addLiquidityNewPoolETH(
        token.address,
        new BN(10000),
        tokenAmount,
        0,
        0,
        liquidityProvider,
        bigAmount,
        {from: trader, value: ethAmount}
      );
      poolAddresses = await factory.getPools(token.address, weth.address);
      pool = await DMMPool.at(poolAddresses[1]);
      await expectEvent.inTransaction(result.tx, pool, 'Sync', {
        reserve0: token.address == token0Address ? tokenAmount : ethAmount,
        reserve1: token.address == token0Address ? ethAmount : tokenAmount
      });
      Helper.assertEqual(await pool.balanceOf(liquidityProvider), expectedLiquidity, 'unexpected liquidity');
      // addliquidity for unamplified again
      result = await router.addLiquidityNewPoolETH(
        token.address,
        new BN(10000),
        tokenAmount,
        0,
        0,
        liquidityProvider,
        bigAmount,
        {from: trader, value: ethAmount}
      );
      poolAddresses = await factory.getPools(token.address, weth.address);
      Helper.assertEqual(poolAddresses.length, 2);
    });

    it('addLiquidity', async () => {
      const token0Amount = Helper.expandTo18Decimals(1);
      const token1Amount = Helper.expandTo18Decimals(4);

      await token0.approve(router.address, bigAmount, {from: trader});
      await token1.approve(router.address, bigAmount, {from: trader});
      // add liquidity to a pool without any reserves
      let result = await router.addLiquidity(
        token0.address,
        token1.address,
        pool.address,
        token0Amount,
        token1Amount,
        0,
        0,
        trader,
        bigAmount,
        {from: trader}
      );
      console.log('gas used', result.receipt.gasUsed);
      await expectEvent.inTransaction(result.tx, pool, 'Sync', {
        reserve0: token0Amount,
        reserve1: token1Amount
      });
      await expectEvent.inTransaction(result.tx, pool, 'Mint', {
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
          ethPartner.address,
          Helper.expandTo18Decimals(2),
          Helper.expandTo18Decimals(2),
          expectedToken0Amount.add(new BN(1)),
          0,
          trader,
          bigAmount,
          {from: trader}
        ),
        'DMMRouter: INVALID_POOL'
      );

      await expectRevert(
        router.addLiquidity(
          token0.address,
          token1.address,
          pool.address,
          Helper.expandTo18Decimals(2),
          Helper.expandTo18Decimals(2),
          expectedToken0Amount.add(new BN(1)),
          0,
          trader,
          bigAmount,
          {from: trader}
        ),
        'DMMRouter: INSUFFICIENT_A_AMOUNT'
      );

      await expectRevert(
        router.addLiquidity(
          token1.address,
          token0.address,
          pool.address,
          updateAmount,
          updateAmount,
          0,
          expectedToken0Amount.add(new BN(1)),
          trader,
          bigAmount,
          {from: trader}
        ),
        'DMMRouter: INSUFFICIENT_B_AMOUNT'
      );

      result = await router.addLiquidity(
        token0.address,
        token1.address,
        pool.address,
        updateAmount,
        updateAmount,
        0,
        0,
        trader,
        bigAmount,
        {from: trader}
      );
      await expectEvent.inTransaction(result.tx, pool, 'Mint', {
        sender: router.address,
        amount0: expectedToken0Amount,
        amount1: updateAmount
      });

      // similar test with token 1
      updateAmount = Helper.expandTo18Decimals(1);
      let expectedToken1Amount = Helper.expandTo18Decimals(4);
      Helper.assertEqual(await router.quote(updateAmount, token0Amount, token1Amount), expectedToken1Amount);

      result = await router.addLiquidity(
        token1.address,
        token0.address,
        pool.address,
        Helper.expandTo18Decimals(5),
        updateAmount,
        0,
        0,
        trader,
        bigAmount,
        {from: trader}
      );
      await expectEvent.inTransaction(result.tx, pool, 'Mint', {
        sender: router.address,
        amount0: updateAmount,
        amount1: expectedToken1Amount
      });
    });

    it('addLiquidityETH', async () => {
      const ethPartnerAmount = Helper.expandTo18Decimals(1);
      const ethAmount = Helper.expandTo18Decimals(4);

      const expectedLiquidity = Helper.expandTo18Decimals(2);
      const token0 = await ethPool.token0();
      await ethPartner.approve(router.address, bigAmount, {from: trader});

      await expectRevert(
        router.addLiquidityETH(
          ethPartner.address,
          pool.address,
          ethPartnerAmount,
          ethPartnerAmount,
          ethAmount,
          trader,
          bigAmount,
          {from: trader, value: ethAmount.add(new BN(100))}
        ),
        'DMMRouter: INVALID_POOL'
      );

      let result = await router.addLiquidityETH(
        ethPartner.address,
        ethPool.address,
        ethPartnerAmount,
        ethPartnerAmount,
        ethAmount,
        trader,
        bigAmount,
        {from: trader, value: ethAmount}
      );
      console.log('addLiquidityETH 1st time: gas used', result.receipt.gasUsed);
      await expectEvent.inTransaction(result.tx, ethPool, 'Sync', {
        reserve0: token0 === ethPartner.address ? ethPartnerAmount : ethAmount,
        reserve1: token0 === ethPartner.address ? ethAmount : ethPartnerAmount
      });
      await expectEvent.inTransaction(result.tx, pool, 'Mint', {
        sender: router.address,
        amount0: token0 === ethPartner.address ? ethPartnerAmount : ethAmount,
        amount1: token0 === ethPartner.address ? ethAmount : ethPartnerAmount
      });
      Helper.assertEqual(await ethPool.balanceOf(trader), expectedLiquidity.sub(MINIMUM_LIQUIDITY));

      // test add Liquidity with extra ETH should return to sender
      result = await router.addLiquidityETH(
        ethPartner.address,
        ethPool.address,
        ethPartnerAmount,
        ethPartnerAmount,
        ethAmount,
        trader,
        bigAmount,
        {from: trader, value: ethAmount.add(new BN(100))}
      );
      await expectEvent.inTransaction(result.tx, pool, 'Mint', {
        sender: router.address,
        amount0: token0 === ethPartner.address ? ethPartnerAmount : ethAmount,
        amount1: token0 === ethPartner.address ? ethAmount : ethPartnerAmount
      });
      Helper.assertEqual(await ethPool.balanceOf(trader), expectedLiquidity.mul(new BN(2)).sub(MINIMUM_LIQUIDITY));

      // test add Liquidity with extra token
      result = await router.addLiquidityETH(
        ethPartner.address,
        ethPool.address,
        ethPartnerAmount.add(new BN(500)),
        ethPartnerAmount,
        ethAmount,
        trader,
        bigAmount,
        {from: trader, value: ethAmount}
      );
      console.log('addLiquidityETH 2nd time: gas used', result.receipt.gasUsed);
      await expectEvent.inTransaction(result.tx, pool, 'Mint', {
        sender: router.address,
        amount0: token0 === ethPartner.address ? ethPartnerAmount : ethAmount,
        amount1: token0 === ethPartner.address ? ethAmount : ethPartnerAmount
      });
      Helper.assertEqual(await ethPool.balanceOf(trader), expectedLiquidity.mul(new BN(3)).sub(MINIMUM_LIQUIDITY));
    });
  });

  it('removeLiquidity', async () => {
    const token0Amount = Helper.expandTo18Decimals(1);
    const token1Amount = Helper.expandTo18Decimals(4);
    await token0.transfer(pool.address, token0Amount, {from: trader});
    await token1.transfer(pool.address, token1Amount, {from: trader});
    await pool.mint(trader);

    const expectedLiquidity = Helper.expandTo18Decimals(2);
    await pool.approve(router.address, bigAmount, {from: trader});
    // revert if amount is smaller than amountMin
    await expectRevert(
      router.removeLiquidity(
        token0.address,
        token1.address,
        pool.address,
        expectedLiquidity.sub(MINIMUM_LIQUIDITY),
        token0Amount.sub(new BN(499)),
        0,
        trader,
        bigAmount,
        {from: trader}
      ),
      'DMMRouter: INSUFFICIENT_A_AMOUNT'
    );

    await expectRevert(
      router.removeLiquidity(
        token1.address,
        token0.address,
        pool.address,
        expectedLiquidity.sub(MINIMUM_LIQUIDITY),
        0,
        token0Amount.sub(new BN(499)),
        trader,
        bigAmount,
        {from: trader}
      ),
      'DMMRouter: INSUFFICIENT_B_AMOUNT'
    );

    await expectRevert(
      router.removeLiquidity(
        token0.address,
        token1.address,
        pool.address,
        expectedLiquidity.sub(MINIMUM_LIQUIDITY),
        0,
        token1Amount.sub(new BN(1999)),
        trader,
        bigAmount,
        {from: trader}
      ),
      'DMMRouter: INSUFFICIENT_B_AMOUNT'
    );

    await expectRevert(
      router.removeLiquidity(
        token0.address,
        token1.address,
        ethPool.address,
        expectedLiquidity.sub(MINIMUM_LIQUIDITY),
        token0Amount.sub(new BN(499)),
        0,
        trader,
        bigAmount,
        {from: trader}
      ),
      'DMMRouter: INVALID_POOL'
    );

    let result = await router.removeLiquidity(
      token0.address,
      token1.address,
      pool.address,
      expectedLiquidity.sub(MINIMUM_LIQUIDITY),
      0,
      0,
      trader,
      bigAmount,
      {from: trader}
    );
    console.log('gas used', result.receipt.gasUsed);
    await expectEvent.inTransaction(result.tx, pool, 'Sync', {
      reserve0: new BN(500),
      reserve1: new BN(2000)
    });
    await expectEvent.inTransaction(result.tx, pool, 'Burn', {
      sender: router.address,
      amount0: token0Amount.sub(new BN(500)),
      amount1: token1Amount.sub(new BN(2000)),
      to: trader
    });

    Helper.assertEqual(await pool.balanceOf(trader), new BN(0));
    Helper.assertEqual(await token0.balanceOf(trader), initTokenAmount.sub(new BN(500)));
    Helper.assertEqual(await token1.balanceOf(trader), initTokenAmount.sub(new BN(2000)));
  });

  it('removeLiquidityETH', async () => {
    const ethPartnerAmount = Helper.expandTo18Decimals(1);
    const ethAmount = Helper.expandTo18Decimals(4);

    await ethPartner.transfer(ethPool.address, ethPartnerAmount, {from: trader});
    await weth.deposit({value: ethAmount});
    await weth.transfer(ethPool.address, ethAmount);
    await ethPool.mint(trader);

    const expectedLiquidity = Helper.expandTo18Decimals(2);
    const token0 = await ethPool.token0();
    await ethPool.approve(router.address, bigAmount, {from: trader});
    let initEthAmount = await Helper.getBalancePromise(trader);
    let result = await router.removeLiquidityETH(
      ethPartner.address,
      ethPool.address,
      expectedLiquidity.sub(MINIMUM_LIQUIDITY),
      0,
      0,
      trader,
      bigAmount,
      {from: trader, gasPrice: new BN(0)}
    );
    console.log('gas used', result.receipt.gasUsed);
    await expectEvent.inTransaction(result.tx, ethPool, 'Sync', {
      reserve0: token0 === ethPartner.address ? new BN(500) : new BN(2000),
      reserve1: token0 === ethPartner.address ? new BN(2000) : new BN(500)
    });

    await expectEvent.inTransaction(result.tx, ethPool, 'Burn', {
      sender: router.address,
      amount0: token0 === ethPartner.address ? ethPartnerAmount.sub(new BN(500)) : ethAmount.sub(new BN(2000)),
      amount1: token0 === ethPartner.address ? ethAmount.sub(new BN(2000)) : ethPartnerAmount.sub(new BN(500)),
      to: router.address
    });
    Helper.assertEqual(await ethPool.balanceOf(trader), new BN(0));
    Helper.assertEqual(await ethPartner.balanceOf(trader), initTokenAmount.sub(new BN(500)));
    Helper.assertEqual(await Helper.getBalancePromise(trader), initEthAmount.add(ethAmount).sub(new BN(2000)));
  });

  it('removeLiquidityWithPermit', async () => {
    const token0Amount = Helper.expandTo18Decimals(1);
    const token1Amount = Helper.expandTo18Decimals(4);
    await token0.transfer(pool.address, token0Amount, {from: trader});
    await token1.transfer(pool.address, token1Amount, {from: trader});
    await pool.mint(liquidityProvider);
    const expectedLiquidity = Helper.expandTo18Decimals(2);

    let nonce = await pool.nonces(liquidityProvider);
    let digest = await Helper.getApprovalDigest(
      pool,
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
      pool.address,
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
    await expectEvent.inTransaction(result.tx, pool, 'Sync', {
      reserve0: new BN(500),
      reserve1: new BN(2000)
    });
    await expectEvent.inTransaction(result.tx, pool, 'Burn', {
      sender: router.address,
      amount0: token0Amount.sub(new BN(500)),
      amount1: token1Amount.sub(new BN(2000)),
      to: liquidityProvider
    });

    Helper.assertEqual(await pool.nonces(liquidityProvider), new BN(1));
    Helper.assertEqual(await pool.balanceOf(liquidityProvider), new BN(0));
    Helper.assertEqual(await token0.balanceOf(liquidityProvider), beforeBalance0.add(token0Amount).sub(new BN(500)));
    Helper.assertEqual(await token1.balanceOf(liquidityProvider), beforeBalance1.add(token1Amount).sub(new BN(2000)));

    // test remove liquidity with approve max
    await token0.transfer(pool.address, token0Amount, {from: trader});
    await token1.transfer(pool.address, token1Amount, {from: trader});
    await pool.mint(liquidityProvider);

    let liquidity = await pool.balanceOf(liquidityProvider);

    nonce = await pool.nonces(liquidityProvider);
    digest = await Helper.getApprovalDigest(pool, liquidityProvider, router.address, MaxUint256, nonce, MaxUint256);

    signature = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(liquidityProviderPkKey.slice(2), 'hex'));

    await router.removeLiquidityWithPermit(
      token0.address,
      token1.address,
      pool.address,
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
    await ethPartner.transfer(ethPool.address, ethPartnerAmount, {from: trader});
    await weth.deposit({value: ethAmount});
    await weth.transfer(ethPool.address, ethAmount);
    await ethPool.mint(liquidityProvider);
    const expectedLiquidity = Helper.expandTo18Decimals(2);
    const token0 = await ethPool.token0();

    const nonce = await ethPool.nonces(trader);
    const digest = await Helper.getApprovalDigest(
      ethPool,
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
      ethPool.address,
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
    await expectEvent.inTransaction(result.tx, ethPool, 'Sync', {
      reserve0: token0 === ethPartner.address ? new BN(500) : new BN(2000),
      reserve1: token0 === ethPartner.address ? new BN(2000) : new BN(500)
    });
    await expectEvent.inTransaction(result.tx, ethPool, 'Burn', {
      sender: router.address,
      amount0: token0 === ethPartner.address ? ethPartnerAmount.sub(new BN(500)) : ethAmount.sub(new BN(2000)),
      amount1: token0 === ethPartner.address ? ethAmount.sub(new BN(2000)) : ethPartnerAmount.sub(new BN(500)),
      to: router.address
    });

    Helper.assertEqual(await pool.balanceOf(liquidityProvider), new BN(0));
    Helper.assertEqual(
      await ethPartner.balanceOf(liquidityProvider),
      beforeTokenBalance.add(ethPartnerAmount).sub(new BN(500))
    );
    Helper.assertEqual(
      await Helper.getBalancePromise(liquidityProvider),
      beforeEthBalance.add(ethAmount).sub(new BN(2000))
    );
  });

  describe('test query rate function', async () => {
    it('getAmountOut', async () => {
      let [factory, pool] = await setupPool(feeToSetter, token0, token1, new BN(20000));
      let router = await DMMRouter.new(factory.address, weth.address);
      const token0Amount = Helper.expandTo18Decimals(5);
      const token1Amount = Helper.expandTo18Decimals(10);
      const swapAmount = Helper.expandTo18Decimals(1);
      const poolsPath = [pool.address];
      const path = [token0.address, token1.address];
      // revert if invalid path.length
      await expectRevert(router.getAmountsOut(swapAmount, poolsPath, [token0.address]), 'DMMRouter: INVALID_PATH');
      await expectRevert(
        router.getAmountsOut(swapAmount, poolsPath, [token0.address, token1.address, weth.address]),
        'DMMRouter: INVALID_POOLS_PATH'
      );

      // revert if there is no liquidity
      await expectRevert(router.getAmountsOut(swapAmount, poolsPath, path), 'DMMLibrary: INSUFFICIENT_LIQUIDITY');

      await addLiquidity(liquidityProvider, pool, token0, token1, token0Amount, token1Amount);
      // revert if amountOut == 0
      await expectRevert(router.getAmountsOut(new BN(0), poolsPath, path), 'DMMLibrary: INSUFFICIENT_INPUT_AMOUNT');

      // test revert amount in
      let amounts = await router.getAmountsOut(swapAmount, poolsPath, path);
      const amountOut = amounts[amounts.length - 1];
      amounts = await router.getAmountsIn(amountOut.add(new BN(1)), poolsPath, path);
      Helper.assertLesser(swapAmount, amounts[0]);
      amounts = await router.getAmountsIn(amountOut, poolsPath, path);
      Helper.assertEqual(swapAmount, amounts[0]);

      // special case virtual balance is not enough for trade
      let bigAmountIn = await dmmHelper.getAmountIn(token1Amount, token0, pool);
      await expectRevert(router.getAmountsOut(bigAmountIn, poolsPath, path), 'DMMLibrary: INSUFFICIENT_LIQUIDITY');
      bigAmountIn = await dmmHelper.getAmountIn(token1Amount.sub(new BN(1)), token0, pool);
      amounts = await router.getAmountsOut(bigAmountIn, poolsPath, path);

      await token0.approve(router.address, bigAmountIn, {from: trader});
      await router.swapExactTokensForTokens(
        bigAmountIn,
        amounts[amounts.length - 1],
        poolsPath,
        path,
        trader,
        Helper.MaxUint256,
        {from: trader}
      );
    });

    it('getAmountIn', async () => {
      [factory, pool] = await setupPool(feeToSetter, token0, token1, new BN(20000));
      let router = await DMMRouter.new(factory.address, weth.address);
      const token0Amount = Helper.expandTo18Decimals(5);
      const token1Amount = Helper.expandTo18Decimals(10);
      const swapAmount = Helper.expandTo18Decimals(1);
      let poolsPath = [pool.address];
      const path = [token0.address, token1.address];
      // revert if there is no liquidity
      await expectRevert(router.getAmountsIn(swapAmount, poolsPath, path), 'DMMLibrary: INSUFFICIENT_LIQUIDITY');

      await addLiquidity(liquidityProvider, pool, token0, token1, token0Amount, token1Amount);
      // revert if amountOut == 0
      await expectRevert(router.getAmountsIn(new BN(0), poolsPath, path), 'DMMLibrary: INSUFFICIENT_OUTPUT_AMOUNT');

      // test revert amount in
      let amounts = await router.getAmountsIn(swapAmount, poolsPath, path);
      const amountIn = amounts[0];
      amounts = await router.getAmountsOut(amountIn.sub(new BN(1)), poolsPath, path);
      Helper.assertGreater(swapAmount, amounts[amounts.length - 1]);
      amounts = await router.getAmountsOut(amountIn, poolsPath, path);
      Helper.assertEqual(swapAmount, amounts[amounts.length - 1]);

      // special case real balance is not enough for trade
      await expectRevert(router.getAmountsIn(token1Amount, poolsPath, path), 'DMMLibrary: INSUFFICIENT_LIQUIDITY');
      amounts = await router.getAmountsIn(token1Amount.sub(new BN(1)), poolsPath, path);

      await token0.approve(router.address, amounts[0], {from: trader});
      await router.swapTokensForExactTokens(
        token1Amount.sub(new BN(1)),
        amounts[0],
        poolsPath,
        path,
        trader,
        Helper.MaxUint256,
        {from: trader}
      );
    });
  });

  it('swapETHForExactTokens', async () => {
    let ethPartnerAmount = Helper.expandTo18Decimals(10);
    let ethAmount = Helper.expandTo18Decimals(5);
    const outputAmount = Helper.expandTo18Decimals(1);
    const swapAmount = new BN('565227237267357629');
    // init pool
    await ethPartner.transfer(ethPool.address, ethPartnerAmount);
    await weth.deposit({value: ethAmount});
    await weth.transfer(ethPool.address, ethAmount);
    await ethPool.mint(trader);

    const ethPoolToken0 = await ethPool.token0();
    const poolsPath = [ethPool.address];
    const path = [weth.address, ethPartner.address];
    let expectAmountIn = (await router.getAmountsIn(outputAmount, poolsPath, path))[0];
    // update amount
    ethAmount = ethAmount.add(expectAmountIn);
    ethPartnerAmount = ethPartnerAmount.sub(outputAmount);

    let tokenBalance = await ethPartner.balanceOf(trader);
    let ethBalance = await Helper.getBalancePromise(trader);
    // revert if invalid path
    await expectRevert(
      router.swapETHForExactTokens(outputAmount, poolsPath, [token0.address, ethPartner.address], trader, bigAmount, {
        from: trader,
        value: swapAmount,
        gasPrice: new BN(0)
      }),
      'DMMRouter: INVALID_PATH'
    );
    // revert if excessive input amount
    await expectRevert(
      router.swapETHForExactTokens(outputAmount, poolsPath, path, trader, bigAmount, {
        from: trader,
        value: expectAmountIn.sub(new BN(1)),
        gasPrice: new BN(0)
      }),
      'DMMRouter: EXCESSIVE_INPUT_AMOUNT'
    );

    result = await router.swapETHForExactTokens(outputAmount, poolsPath, path, trader, bigAmount, {
      from: trader,
      value: swapAmount,
      gasPrice: new BN(0)
    });
    console.log('gas used', result.receipt.gasUsed);

    await expectEvent.inTransaction(result.tx, ethPool, 'Swap', {
      sender: router.address,
      amount0In: ethPoolToken0 === ethPartner.address ? new BN(0) : expectAmountIn,
      amount1In: ethPoolToken0 === ethPartner.address ? expectAmountIn : new BN(0),
      amount0Out: ethPoolToken0 === ethPartner.address ? outputAmount : new BN(0),
      amount1Out: ethPoolToken0 === ethPartner.address ? new BN(0) : outputAmount,
      to: trader
    });

    await expectEvent.inTransaction(result.tx, ethPool, 'Sync', {
      reserve0: ethPoolToken0 === ethPartner.address ? ethPartnerAmount : ethAmount,
      reserve1: ethPoolToken0 === ethPartner.address ? ethAmount : ethPartnerAmount
    });

    Helper.assertEqual(await ethPartner.balanceOf(trader), tokenBalance.add(outputAmount));
    Helper.assertEqual(await Helper.getBalancePromise(trader), ethBalance.sub(expectAmountIn));

    // edge case not refund dust eth if msg.value = amounts[0]
    await time.advanceBlock();
    expectAmountIn = (await router.getAmountsIn(outputAmount, poolsPath, path))[0];

    result = await router.swapETHForExactTokens(outputAmount, poolsPath, path, trader, bigAmount, {
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

    await ethPartner.transfer(ethPool.address, ethPartnerAmount);
    await weth.deposit({value: ethAmount});
    await weth.transfer(ethPool.address, ethAmount);
    await ethPool.mint(trader);

    const ethPoolToken0 = await ethPool.token0();

    const path = [ethPartner.address, weth.address];
    const poolsPath = [ethPool.address];
    let amounts = await router.getAmountsOut(swapAmount, poolsPath, path);
    let expectAmountOut = amounts[amounts.length - 1];

    await ethPartner.approve(router.address, bigAmount, {from: trader});
    let ethBalance = await Helper.getBalancePromise(trader);
    let tokenBalance = await ethPartner.balanceOf(trader);

    await expectRevert(
      router.swapExactTokensForETH(swapAmount, 0, poolsPath, [ethPartner.address, token0.address], trader, bigAmount, {
        from: trader,
        gasPrice: new BN(0)
      }),
      'DMMRouter: INVALID_PATH'
    );
    await expectRevert(
      router.swapExactTokensForETH(swapAmount, expectAmountOut.add(BNOne), poolsPath, path, trader, bigAmount, {
        from: trader,
        gasPrice: new BN(0)
      }),
      'DMMRouter: INSUFFICIENT_OUTPUT_AMOUNT'
    );
    let result = await router.swapExactTokensForETH(swapAmount, 0, poolsPath, path, trader, bigAmount, {
      from: trader,
      gasPrice: new BN(0)
    });
    console.log('gas used', result.receipt.gasUsed);

    ethPartnerAmount = ethPartnerAmount.add(swapAmount);
    ethAmount = ethAmount.sub(expectAmountOut);
    await expectEvent.inTransaction(result.tx, ethPool, 'Sync', {
      reserve0: ethPoolToken0 === ethPartner.address ? ethPartnerAmount : ethAmount,
      reserve1: ethPoolToken0 === ethPartner.address ? ethAmount : ethPartnerAmount
    });
    await expectEvent.inTransaction(result.tx, ethPool, 'Swap', {
      sender: router.address,
      amount0In: ethPoolToken0 === ethPartner.address ? swapAmount : new BN(0),
      amount1In: ethPoolToken0 === ethPartner.address ? new BN(0) : swapAmount,
      amount0Out: ethPoolToken0 === ethPartner.address ? new BN(0) : expectAmountOut,
      amount1Out: ethPoolToken0 === ethPartner.address ? expectAmountOut : new BN(0),
      to: router.address
    });

    Helper.assertEqual(await ethPartner.balanceOf(trader), tokenBalance.sub(swapAmount));
    Helper.assertEqual(await Helper.getBalancePromise(trader), ethBalance.add(expectAmountOut));
  });

  it('swapTokensForExactETH', async () => {
    let ethPartnerAmount = Helper.expandTo18Decimals(5);
    let ethAmount = Helper.expandTo18Decimals(10);
    const outputAmount = Helper.expandTo18Decimals(1);
    const poolsPath = [ethPool.address];
    const path = [ethPartner.address, weth.address];

    await ethPartner.transfer(ethPool.address, ethPartnerAmount);
    await weth.deposit({value: ethAmount});
    await weth.transfer(ethPool.address, ethAmount);
    await ethPool.mint(trader, {from: trader});

    await ethPartner.approve(router.address, bigAmount, {from: trader});
    const ethPoolToken0 = await ethPool.token0();

    let amounts = await router.getAmountsIn(outputAmount, poolsPath, path);
    let expectAmountIn = amounts[0];

    let ethBalance = await Helper.getBalancePromise(trader);
    let tokenBalance = await ethPartner.balanceOf(trader);

    const invalidPath = [ethPartner.address, token0.address];
    await expectRevert(
      router.swapTokensForExactETH(outputAmount, bigAmount, poolsPath, invalidPath, trader, bigAmount, {
        from: trader,
        gasPrice: new BN(0)
      }),
      'DMMRouter: INVALID_PATH'
    );

    await expectRevert(
      router.swapTokensForExactETH(outputAmount, expectAmountIn.sub(BNOne), poolsPath, path, trader, bigAmount, {
        from: trader,
        gasPrice: new BN(0)
      }),
      'DMMRouter: EXCESSIVE_INPUT_AMOUNT'
    );
    let result = await router.swapTokensForExactETH(outputAmount, bigAmount, poolsPath, path, trader, bigAmount, {
      from: trader,
      gasPrice: new BN(0)
    });
    console.log('gas used', result.receipt.gasUsed);

    ethAmount = ethAmount.sub(outputAmount);
    ethPartnerAmount = ethPartnerAmount.add(expectAmountIn);
    await expectEvent.inTransaction(result.tx, ethPool, 'Sync', {
      reserve0: ethPoolToken0 === ethPartner.address ? ethPartnerAmount : ethAmount,
      reserve1: ethPoolToken0 === ethPartner.address ? ethAmount : ethPartnerAmount
    });
    await expectEvent.inTransaction(result.tx, ethPool, 'Swap', {
      sender: router.address,
      amount0In: ethPoolToken0 === ethPartner.address ? expectAmountIn : new BN(0),
      amount1In: ethPoolToken0 === ethPartner.address ? new BN(0) : expectAmountIn,
      amount0Out: ethPoolToken0 === ethPartner.address ? new BN(0) : outputAmount,
      amount1Out: ethPoolToken0 === ethPartner.address ? outputAmount : new BN(0),
      to: router.address
    });

    Helper.assertEqual(await ethPartner.balanceOf(trader), tokenBalance.sub(expectAmountIn));
    Helper.assertEqual(await Helper.getBalancePromise(trader), ethBalance.add(outputAmount));
  });

  it('swapExactETHForTokens', async () => {
    let ethPartnerAmount = Helper.expandTo18Decimals(10);
    let ethAmount = Helper.expandTo18Decimals(5);
    const swapAmount = Helper.expandTo18Decimals(1);
    const poolsPath = [ethPool.address];
    const path = [weth.address, ethPartner.address];

    await ethPartner.transfer(ethPool.address, ethPartnerAmount);
    await weth.deposit({value: ethAmount});
    await weth.transfer(ethPool.address, ethAmount);
    await ethPool.mint(trader);

    await token0.approve(router.address, bigAmount, {from: trader});

    const ethPoolToken0 = await ethPool.token0();

    let amounts = await router.getAmountsOut(swapAmount, poolsPath, path);
    let expectedOutputAmount = amounts[amounts.length - 1];

    let ethBalance = await Helper.getBalancePromise(trader);
    let tokenBalance = await ethPartner.balanceOf(trader);

    const invalidPath = [token0.address, ethPartner.address];
    await expectRevert(
      router.swapExactETHForTokens(0, poolsPath, invalidPath, trader, bigAmount, {
        from: trader,
        value: swapAmount,
        gasPrice: 0
      }),
      'DMMRouter: INVALID_PATH'
    );
    await expectRevert(
      router.swapExactETHForTokens(expectedOutputAmount.add(BNOne), poolsPath, path, trader, bigAmount, {
        from: trader,
        value: swapAmount,
        gasPrice: 0
      }),
      'DMMRouter: INSUFFICIENT_OUTPUT_AMOUNT'
    );
    let result = await router.swapExactETHForTokens(0, poolsPath, path, trader, bigAmount, {
      from: trader,
      value: swapAmount,
      gasPrice: 0
    });
    console.log('gas used', result.receipt.gasUsed);

    ethPartnerAmount = ethPartnerAmount.sub(expectedOutputAmount);
    ethAmount = ethAmount.add(swapAmount);
    await expectEvent.inTransaction(result.tx, ethPool, 'Sync', {
      reserve0: ethPoolToken0 === ethPartner.address ? ethPartnerAmount : ethAmount,
      reserve1: ethPoolToken0 === ethPartner.address ? ethAmount : ethPartnerAmount
    });
    await expectEvent.inTransaction(result.tx, ethPool, 'Swap', {
      sender: router.address,
      amount0In: ethPoolToken0 === ethPartner.address ? new BN(0) : swapAmount,
      amount1In: ethPoolToken0 === ethPartner.address ? swapAmount : new BN(0),
      amount0Out: ethPoolToken0 === ethPartner.address ? expectedOutputAmount : new BN(0),
      amount1Out: ethPoolToken0 === ethPartner.address ? new BN(0) : expectedOutputAmount,
      to: trader
    });

    Helper.assertEqual(await ethPartner.balanceOf(trader), tokenBalance.add(expectedOutputAmount));
    Helper.assertEqual(await Helper.getBalancePromise(trader), ethBalance.sub(swapAmount));
  });

  it('swapExactTokensForTokens', async () => {
    const token0Amount = Helper.expandTo18Decimals(5);
    const token1Amount = Helper.expandTo18Decimals(10);
    const swapAmount = Helper.expandTo18Decimals(1);
    const poolsPath = [pool.address];
    const path = [token0.address, token1.address];

    await token0.transfer(pool.address, token0Amount);
    await token1.transfer(pool.address, token1Amount);
    await pool.mint(trader);
    await token0.approve(router.address, bigAmount, {from: trader});

    let amounts = await router.getAmountsOut(swapAmount, poolsPath, path);
    let expectedOutputAmount = amounts[amounts.length - 1];

    const token0Balance = await token0.balanceOf(trader);
    const token1Balance = await token1.balanceOf(trader);

    // revert if amountDesired < amountOut
    await expectRevert(
      router.swapExactTokensForTokens(
        swapAmount,
        expectedOutputAmount.add(new BN(1)),
        poolsPath,
        path,
        trader,
        bigAmount,
        {
          from: trader
        }
      ),
      'DMMRouter: INSUFFICIENT_OUTPUT_AMOUNT'
    );

    // revert if over deadline
    let expiredTimeStamp = (await Helper.getCurrentBlockTime()) - 1;
    await expectRevert(
      router.swapExactTokensForTokens(swapAmount, 0, poolsPath, path, trader, expiredTimeStamp, {from: trader}),
      'DMMRouter: EXPIRED'
    );

    let result = await router.swapExactTokensForTokens(swapAmount, 0, poolsPath, path, trader, bigAmount, {
      from: trader
    });
    console.log('gas used', result.receipt.gasUsed);

    await expectEvent.inTransaction(result.tx, pool, 'Sync', {
      reserve0: token0Amount.add(swapAmount),
      reserve1: token1Amount.sub(expectedOutputAmount)
    });
    await expectEvent.inTransaction(result.tx, pool, 'Swap', {
      sender: router.address,
      amount0In: swapAmount,
      amount1In: new BN(0),
      amount0Out: new BN(0),
      amount1Out: expectedOutputAmount,
      to: trader
    });

    Helper.assertEqual(await token0.balanceOf(trader), token0Balance.sub(swapAmount));
    Helper.assertEqual(await token1.balanceOf(trader), token1Balance.add(expectedOutputAmount));
  });

  it('swapTokensForExactTokens', async () => {
    const token0Amount = Helper.expandTo18Decimals(5);
    const token1Amount = Helper.expandTo18Decimals(10);
    const outputAmount = Helper.expandTo18Decimals(1);
    const poolsPath = [pool.address];
    const path = [token0.address, token1.address];

    await token0.transfer(pool.address, token0Amount);
    await token1.transfer(pool.address, token1Amount);
    await pool.mint(trader);
    await token0.approve(router.address, bigAmount, {from: trader});

    let amounts = await router.getAmountsIn(outputAmount, poolsPath, path);
    let expectedSwapAmount = amounts[0];

    const token0Balance = await token0.balanceOf(trader);
    const token1Balance = await token1.balanceOf(trader);
    // revert if amountDesired > amountIn
    await expectRevert(
      router.swapTokensForExactTokens(
        outputAmount,
        expectedSwapAmount.sub(new BN(1)),
        poolsPath,
        path,
        trader,
        bigAmount,
        {
          from: trader
        }
      ),
      'DMMRouter: EXCESSIVE_INPUT_AMOUNT'
    );
    // revert if over deadline
    let expiredTimeStamp = (await Helper.getCurrentBlockTime()) - 1;
    await expectRevert(
      router.swapTokensForExactTokens(outputAmount, bigAmount, poolsPath, path, trader, expiredTimeStamp, {
        from: trader
      }),
      'DMMRouter: EXPIRED'
    );

    let result = await router.swapTokensForExactTokens(outputAmount, bigAmount, poolsPath, path, trader, bigAmount, {
      from: trader
    });

    await expectEvent.inTransaction(result.tx, pool, 'Sync', {
      reserve0: token0Amount.add(expectedSwapAmount),
      reserve1: token1Amount.sub(outputAmount)
    });

    await expectEvent.inTransaction(result.tx, pool, 'Swap', {
      sender: router.address,
      amount0In: expectedSwapAmount,
      amount1In: new BN(0),
      amount0Out: new BN(0),
      amount1Out: outputAmount,
      to: trader
    });

    Helper.assertEqual(await token0.balanceOf(trader), token0Balance.sub(expectedSwapAmount));
    Helper.assertEqual(await token1.balanceOf(trader), token1Balance.add(outputAmount));
  });
});

async function setupFactory (admin) {
  return await DMMFactory.new(admin);
}

async function setupPool (admin, token0, token1, ampBps) {
  const factory = await setupFactory(admin);
  await factory.createPool(token0.address, token1.address, ampBps);

  const poolAddrs = await factory.getPools(token0.address, token1.address);
  const pool = await DMMPool.at(poolAddrs[0]);

  return [factory, pool];
}

async function addLiquidity (liquidityProvider, pool, token0, token1, token0Amount, token1Amount) {
  await token0.transfer(pool.address, token0Amount);
  await token1.transfer(pool.address, token1Amount);
  await pool.mint(liquidityProvider);
}
