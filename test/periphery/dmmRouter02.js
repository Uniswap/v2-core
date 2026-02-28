const Helper = require('../helper');
const {MaxUint256, ethAddress, expandTo18Decimals, MINIMUM_LIQUIDITY} = require('../helper');
const BN = web3.utils.BN;
const {ecsign} = require('ethereumjs-util');
const expectRevert = require('@openzeppelin/test-helpers/src/expectRevert');

const DMMFactory = artifacts.require('DMMFactory');
const DMMPool = artifacts.require('DMMPool');
const FeeToken = artifacts.require('MockFeeOnTransferERC20');
const TestToken = artifacts.require('TestToken');
const WETH = artifacts.require('WETH9');

const DMMRouter02 = artifacts.require('DMMRouter02');

let feeToken;
let normalToken;

let factory;
let pool;
let router;
let weth;
let tokenPool;

let feeSetter;
let liquidityProvider;

contract('DMMRouter02', accounts => {
  before('set accounts', async () => {
    feeSetter = accounts[0];
    liquidityProvider = accounts[3];
    // key from hardhat.config.js
    liquidityProviderPkKey = '0xee9d129c1997549ee09c0757af5939b2483d80ad649a0eda68e8b0357ad11131';
    trader = accounts[2];
    weth = await WETH.new();
  });

  beforeEach(' setup factory and router', async () => {
    feeToken = await FeeToken.new('feeOnTransfer Token', 'FOT', expandTo18Decimals(100000));
    normalToken = await TestToken.new('test', 't1', expandTo18Decimals(100000));

    factory = await DMMFactory.new(feeSetter);
    router = await DMMRouter02.new(factory.address, weth.address);
    // make a DTT<>WETH pool
    await factory.createPool(feeToken.address, weth.address, new BN(10000));
    const poolAddresses = await factory.getPools(feeToken.address, weth.address);
    pool = await DMMPool.at(poolAddresses[0]);
  });

  afterEach(async function () {
    Helper.assertEqual(await Helper.getBalancePromise(router.address), new BN(0));
  });

  async function addLiquidity (feeTokenAmount, ethAmount, liquidityProvider) {
    await feeToken.approve(router.address, MaxUint256);
    await router.addLiquidityETH(
      feeToken.address,
      pool.address,
      feeTokenAmount,
      feeTokenAmount,
      ethAmount,
      [Helper.zeroBN, Helper.MaxUint256],
      liquidityProvider,
      MaxUint256,
      {
        value: ethAmount
      }
    );
  }

  it('removeLiquidityETHSupportingFeeOnTransferTokens', async () => {
    let feeTokenAmount = expandTo18Decimals(1);
    let ethAmount = expandTo18Decimals(4);
    await addLiquidity(feeTokenAmount, ethAmount, liquidityProvider);
    feeTokenAmount = await feeToken.balanceOf(pool.address);

    const liquidity = await pool.balanceOf(liquidityProvider);
    const totalSupply = await pool.totalSupply();
    const feeTokenExpected = feeTokenAmount.mul(liquidity).div(totalSupply);
    const ethExpected = ethAmount.mul(liquidity).div(totalSupply);

    await pool.approve(router.address, MaxUint256, {from: liquidityProvider});
    await router.removeLiquidityETHSupportingFeeOnTransferTokens(
      feeToken.address,
      pool.address,
      liquidity,
      feeTokenExpected,
      ethExpected,
      liquidityProvider,
      MaxUint256,
      {
        from: liquidityProvider
      }
    );
  });

  // ETH -> DTT
  it('swapExactETHForTokensSupportingFeeOnTransferTokens', async () => {
    const feeTokenAmount = expandTo18Decimals(10)
      .mul(new BN(100))
      .div(new BN(99));
    const ethAmount = expandTo18Decimals(5);
    const swapAmount = expandTo18Decimals(1);
    const poolsPath = [pool.address];
    const path = [weth.address, feeToken.address];
    await addLiquidity(feeTokenAmount, ethAmount, liquidityProvider);

    await expectRevert(
      router.swapExactETHForTokensSupportingFeeOnTransferTokens(
        0,
        [pool.address],
        [normalToken.address, feeToken.address],
        trader,
        MaxUint256,
        {
          from: trader,
          value: swapAmount
        }
      ),
      'DMMRouter: INVALID_PATH'
    );

    const amounts = await router.getAmountsOut(swapAmount, poolsPath, path);
    await expectRevert(
      router.swapExactETHForTokensSupportingFeeOnTransferTokens(
        amounts[amounts.length - 1],
        poolsPath,
        path,
        trader,
        MaxUint256,
        {
          from: trader,
          value: swapAmount
        }
      ),
      'DMMRouter: INSUFFICIENT_OUTPUT_AMOUNT'
    );
    await router.swapExactETHForTokensSupportingFeeOnTransferTokens(0, poolsPath, path, trader, MaxUint256, {
      from: trader,
      value: swapAmount
    });
  });

  // DTT -> ETH
  it('swapExactTokensForETHSupportingFeeOnTransferTokens', async () => {
    const feeTokenAmount = expandTo18Decimals(5)
      .mul(new BN(100))
      .div(new BN(99));
    const path = [feeToken.address, weth.address];
    const poolsPath = [pool.address];
    const ethAmount = expandTo18Decimals(10);
    const swapAmount = expandTo18Decimals(1);
    await addLiquidity(feeTokenAmount, ethAmount, liquidityProvider);

    await feeToken.transfer(trader, swapAmount.mul(new BN(2)));
    await feeToken.approve(router.address, MaxUint256, {from: trader});
    await expectRevert(
      router.swapExactTokensForETHSupportingFeeOnTransferTokens(
        swapAmount,
        0,
        poolsPath,
        [feeToken.address, normalToken.address],
        trader,
        MaxUint256,
        {
          from: trader
        }
      ),
      'DMMRouter: INVALID_PATH'
    );
    const amounts = await router.getAmountsOut(swapAmount, poolsPath, path);
    await expectRevert(
      router.swapExactTokensForETHSupportingFeeOnTransferTokens(
        swapAmount,
        amounts[amounts.length - 1],
        poolsPath,
        path,
        trader,
        MaxUint256,
        {
          from: trader
        }
      ),
      'DMMRouter: INSUFFICIENT_OUTPUT_AMOUNT'
    );
    await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      swapAmount,
      0,
      poolsPath,
      path,
      trader,
      MaxUint256,
      {
        from: trader
      }
    );
  });

  it('swapExactTokensForTokensSupportingFeeOnTransferTokens', async () => {
    const feeToken2 = await FeeToken.new('feeOnTransfer Token2', 'FOT2', expandTo18Decimals(100000));

    /// create pool
    await factory.createPool(feeToken.address, feeToken2.address, new BN(10000));
    const poolAddresses = await factory.getPools(feeToken.address, feeToken2.address);
    tokenPool = await DMMPool.at(poolAddresses[poolAddresses.length - 1]);

    const feeTokenAmount = expandTo18Decimals(5)
      .mul(new BN(100))
      .div(new BN(99));
    const feeTokenAmount2 = expandTo18Decimals(5);
    const amountIn = expandTo18Decimals(1);

    await feeToken.transfer(tokenPool.address, feeTokenAmount);
    await feeToken2.transfer(tokenPool.address, feeTokenAmount2);
    await tokenPool.mint(liquidityProvider);
    // approve to the router and tranfer token to trader
    await feeToken.approve(router.address, MaxUint256, {from: trader});
    await feeToken.transfer(trader, amountIn.mul(new BN(2)));

    const amounts = await router.getAmountsOut(amountIn, [tokenPool.address], [feeToken.address, feeToken2.address]);
    await expectRevert(
      router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
        amountIn,
        amounts[amounts.length - 1],
        [tokenPool.address],
        [feeToken.address, feeToken2.address],
        trader,
        MaxUint256,
        {from: trader}
      ),
      'DMMRouter: INSUFFICIENT_OUTPUT_AMOUNT'
    );

    await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
      amountIn,
      0,
      [tokenPool.address],
      [feeToken.address, feeToken2.address],
      trader,
      MaxUint256,
      {from: trader}
    );
  });

  it('removeLiquidityETHWithPermitSupportingFeeOnTransferTokens', async () => {
    let feeTokenAmount = expandTo18Decimals(1);
    let ethAmount = expandTo18Decimals(4);
    await addLiquidity(feeTokenAmount, ethAmount, liquidityProvider);

    const liquidity = await pool.balanceOf(liquidityProvider);

    const nonce = await pool.nonces(liquidityProvider);
    const digest = await Helper.getApprovalDigest(
      pool,
      liquidityProvider,
      router.address,
      liquidity,
      nonce,
      MaxUint256
    );
    const {v, r, s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(liquidityProviderPkKey.slice(2), 'hex'));

    feeTokenAmount = await feeToken.balanceOf(pool.address);
    const totalSupply = await pool.totalSupply();
    const feeTokenExpected = feeTokenAmount.mul(liquidity).div(totalSupply);
    const ethExpected = ethAmount.mul(liquidity).div(totalSupply);

    await pool.approve(router.address, MaxUint256, {from: liquidityProvider});
    await router.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
      feeToken.address,
      pool.address,
      liquidity,
      feeTokenExpected,
      ethExpected,
      liquidityProvider,
      MaxUint256,
      false,
      v,
      r,
      s,
      {from: liquidityProvider}
    );
  });
});
