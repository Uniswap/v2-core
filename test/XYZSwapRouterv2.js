const Helper = require('./helper');
const {MaxUint256, ethAddress, expandTo18Decimals, MINIMUM_LIQUIDITY} = require('./helper');
const BN = web3.utils.BN;
const {ecsign} = require('ethereumjs-util');
const expectRevert = require('@openzeppelin/test-helpers/src/expectRevert');

const XYZSwapFactory = artifacts.require('XYZSwapFactory');
const XYZSwapPair = artifacts.require('XYZSwapPair');
const FeeToken = artifacts.require('MockFeeOnTransferERC20');
const TestToken = artifacts.require('TestToken');
const WETH = artifacts.require('WETH9');

const XYZSwapRouter02 = artifacts.require('XYZSwapRouter02');

let feeToken;
let normalToken;

let factory;
let pair;
let router;
let weth;

let feeSetter;
let liquidityProvider;

contract('XYZSwapRouter02', accounts => {
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

    factory = await XYZSwapFactory.new(feeSetter);
    router = await XYZSwapRouter02.new(factory.address, weth.address);
    // make a DTT<>WETH pair
    await factory.createPair(feeToken.address, weth.address, new BN(10000));
    const pairAddresses = await factory.getPairs(feeToken.address, weth.address);
    pair = await XYZSwapPair.at(pairAddresses[0]);
  });

  afterEach(async function () {
    Helper.assertEqual(await Helper.getBalancePromise(router.address), new BN(0));
  });

  async function addLiquidity (feeTokenAmount, ethAmount, liquidityProvider) {
    await feeToken.approve(router.address, MaxUint256);
    await router.addLiquidityETH(
      feeToken.address,
      pair.address,
      feeTokenAmount,
      feeTokenAmount,
      ethAmount,
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
    feeTokenAmount = await feeToken.balanceOf(pair.address);

    const liquidity = await pair.balanceOf(liquidityProvider);
    const totalSupply = await pair.totalSupply();
    const feeTokenExpected = feeTokenAmount.mul(liquidity).div(totalSupply);
    const ethExpected = ethAmount.mul(liquidity).div(totalSupply);

    await pair.approve(router.address, MaxUint256, {from: liquidityProvider});
    await router.removeLiquidityETHSupportingFeeOnTransferTokens(
      feeToken.address,
      pair.address,
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
    const pairsPath = [pair.address];
    const path = [weth.address, feeToken.address];
    await addLiquidity(feeTokenAmount, ethAmount, liquidityProvider);

    await expectRevert(
      router.swapExactETHForTokensSupportingFeeOnTransferTokens(
        0,
        [pair.address],
        [normalToken.address, feeToken.address],
        trader,
        MaxUint256,
        {
          from: trader,
          value: swapAmount
        }
      ),
      'XYZSwapRouter: INVALID_PATH'
    );

    const amounts = await router.getAmountsOut(swapAmount, pairsPath, path);
    await expectRevert(
      router.swapExactETHForTokensSupportingFeeOnTransferTokens(
        amounts[amounts.length - 1],
        pairsPath,
        path,
        trader,
        MaxUint256,
        {
          from: trader,
          value: swapAmount
        }
      ),
      'XYZSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT'
    );
    await router.swapExactETHForTokensSupportingFeeOnTransferTokens(0, pairsPath, path, trader, MaxUint256, {
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
    const pairsPath = [pair.address];
    const ethAmount = expandTo18Decimals(10);
    const swapAmount = expandTo18Decimals(1);
    await addLiquidity(feeTokenAmount, ethAmount, liquidityProvider);

    await feeToken.transfer(trader, swapAmount.mul(new BN(2)));
    await feeToken.approve(router.address, MaxUint256, {from: trader});
    await expectRevert(
      router.swapExactTokensForETHSupportingFeeOnTransferTokens(
        swapAmount,
        0,
        pairsPath,
        [feeToken.address, normalToken.address],
        trader,
        MaxUint256,
        {
          from: trader
        }
      ),
      'XYZSwapRouter: INVALID_PATH'
    );
    const amounts = await router.getAmountsOut(swapAmount, pairsPath, path);
    await expectRevert(
      router.swapExactTokensForETHSupportingFeeOnTransferTokens(
        swapAmount,
        amounts[amounts.length - 1],
        pairsPath,
        path,
        trader,
        MaxUint256,
        {
          from: trader
        }
      ),
      'XYZSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT'
    );
    await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      swapAmount,
      0,
      pairsPath,
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

    /// create pair
    await factory.createPair(feeToken.address, feeToken2.address, new BN(10000));
    const pairAddresses = await factory.getPairs(feeToken.address, feeToken2.address);
    tokenPair = await XYZSwapPair.at(pairAddresses[0]);

    const feeTokenAmount = expandTo18Decimals(5)
      .mul(new BN(100))
      .div(new BN(99));
    const feeTokenAmount2 = expandTo18Decimals(5);
    const amountIn = expandTo18Decimals(1);

    await feeToken.approve(router.address, MaxUint256);
    await feeToken2.approve(router.address, MaxUint256);
    await router.addLiquidity(
      feeToken.address,
      feeToken2.address,
      tokenPair.address,
      feeTokenAmount,
      feeTokenAmount2,
      feeTokenAmount,
      feeTokenAmount2,
      liquidityProvider,
      MaxUint256
    );

    await feeToken.approve(router.address, MaxUint256, {from: trader});
    await feeToken.transfer(trader, amountIn.mul(new BN(2)));

    const amounts = await router.getAmountsOut(amountIn, [tokenPair.address], [feeToken.address, feeToken2.address]);
    await expectRevert(
      router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
        amountIn,
        amounts[amounts.length - 1],
        [tokenPair.address],
        [feeToken.address, feeToken2.address],
        trader,
        MaxUint256,
        {from: trader}
      ),
      'XYZSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT'
    );

    await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
      amountIn,
      0,
      [tokenPair.address],
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

    const liquidity = await pair.balanceOf(liquidityProvider);

    const nonce = await pair.nonces(liquidityProvider);
    const digest = await Helper.getApprovalDigest(
      pair,
      liquidityProvider,
      router.address,
      liquidity,
      nonce,
      MaxUint256
    );
    const {v, r, s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(liquidityProviderPkKey.slice(2), 'hex'));

    feeTokenAmount = await feeToken.balanceOf(pair.address);
    const totalSupply = await pair.totalSupply();
    const feeTokenExpected = feeTokenAmount.mul(liquidity).div(totalSupply);
    const ethExpected = ethAmount.mul(liquidity).div(totalSupply);

    await pair.approve(router.address, MaxUint256, {from: liquidityProvider});
    await router.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
      feeToken.address,
      pair.address,
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
