const BN = web3.utils.BN;
const Helper = require('./helper');
const {expandTo18Decimals, MaxUint256} = require('./helper');

const DMMRouter = artifacts.require('DMMRouter02');
const DMMPool = artifacts.require('DMMPool');
const DMMFactory = artifacts.require('DMMFactory');
const WETH = artifacts.require('WETH9');
const TestToken = artifacts.require('TestToken');
const ExampleFlashSwap = artifacts.require('ExampleFlashSwap');
const UniswapV2Factory = Helper.getTruffleContract('./node_modules/@uniswap/v2-core/build/UniswapV2Factory.json');
const UniswapV2Router = Helper.getTruffleContract('./node_modules/@uniswap/v2-periphery/build/UniswapV2Router02.json');

let weth;
let liquidityProvider;
let trader;
let flashSwap;
let dmmFactory;
let dmmRouter;
let ethDmmPool;

let uniswapFactory;
let uniswapRouter;

contract('ExampleFlashSwap', accounts => {
  beforeEach('setup', async () => {
    liquidityProvider = accounts[0];
    trader = accounts[0];
    dmmFactory = await DMMFactory.new(accounts[0]);
    ethPartner = await TestToken.new('WETH Partner', 'WETH-P', Helper.expandTo18Decimals(10000));
    weth = await WETH.new();
    dmmRouter = await DMMRouter.new(dmmFactory.address, weth.address);

    uniswapFactory = await UniswapV2Factory.new(accounts[0]);
    uniswapRouter = await UniswapV2Router.new(uniswapFactory.address, weth.address);

    flashSwap = await ExampleFlashSwap.new(uniswapRouter.address, dmmFactory.address);

    // await ethPartner.transfer(trader, initTokenAmount);
    await dmmFactory.createPool(weth.address, ethPartner.address, new BN(10000));
    const ethPoolAddress = await dmmFactory.getPools(weth.address, ethPartner.address);
    ethDmmPool = await DMMPool.at(ethPoolAddress[0]);
  });

  it('uniswapV2Call:0', async () => {
    // add liquidity to uniswap at a rate of 1 ETH / 200 X
    const ethUniswapPartnerAmount = expandTo18Decimals(2000);
    const ethUniswapAmount = expandTo18Decimals(10);
    await ethPartner.approve(uniswapRouter.address, ethUniswapPartnerAmount);
    await uniswapRouter.addLiquidityETH(
      ethPartner.address,
      ethUniswapPartnerAmount,
      0,
      0,
      liquidityProvider,
      MaxUint256,
      {
        value: ethUniswapAmount,
        from: accounts[0]
      }
    );

    // add liquidity to dmmSwap at a rate of 1 ETH / 100 X
    const ethPartnerDmmAmount = expandTo18Decimals(1000);
    const ethDmmAmount = expandTo18Decimals(10);
    await ethPartner.transfer(ethDmmPool.address, ethPartnerDmmAmount);
    await weth.deposit({value: ethDmmAmount});
    await weth.transfer(ethDmmPool.address, ethDmmAmount);
    await ethDmmPool.mint(liquidityProvider);

    const balanceBefore = await Helper.getBalancePromise(trader);

    // now, execute arbitrage via dmmSwapCall:
    // receive 1 ETH from dmmSwap, get as minimum X from uniswap, repay dmmSwap with minimum X, keep the rest!
    const arbitrageAmount = expandTo18Decimals(1);
    // instead of being 'hard-coded', the above value could be calculated optimally off-chain. this would be
    // better, but it'd be better yet to calculate the amount at runtime, on-chain. unfortunately, this requires a
    // swap-to-price calculation, which is a little tricky, and out of scope for the moment
    const ethPoolToken0 = await ethDmmPool.token0();
    const amount0 = ethPoolToken0 === ethPartner.address ? new BN(0) : arbitrageAmount;
    const amount1 = ethPoolToken0 === ethPartner.address ? arbitrageAmount : new BN(0);
    await ethDmmPool.swap(amount0, amount1, flashSwap.address, web3.eth.abi.encodeParameters(['uint'], [new BN(1)]), {
      from: trader,
      gasPrice: new BN(0)
    });

    const balanceAfter = await Helper.getBalancePromise(trader);
    Helper.assertGreater(balanceAfter, balanceBefore);
    // console.log(`profit = ${balanceAfter.sub(balanceBefore).toString()}`);
  });

  it('uniswapV2Call:1', async () => {
    // add liquidity to uniswap at a rate of 1 ETH / 100 X
    const ethUniswapPartnerAmount = expandTo18Decimals(1000);
    const ethUniswapAmount = expandTo18Decimals(10);
    await ethPartner.approve(uniswapRouter.address, ethUniswapPartnerAmount);
    await uniswapRouter.addLiquidityETH(
      ethPartner.address,
      ethUniswapPartnerAmount,
      0,
      0,
      liquidityProvider,
      MaxUint256,
      {
        value: ethUniswapAmount,
        from: accounts[0]
      }
    );

    // add liquidity to dmmSwap at a rate of 1 ETH / 200 X
    const ethPartnerDmmAmount = expandTo18Decimals(2000);
    const ethDmmAmount = expandTo18Decimals(10);
    await ethPartner.transfer(ethDmmPool.address, ethPartnerDmmAmount);
    await weth.deposit({value: ethDmmAmount});
    await weth.transfer(ethDmmPool.address, ethDmmAmount);
    await ethDmmPool.mint(liquidityProvider);

    const balanceBefore = await Helper.getBalancePromise(trader);

    // now, execute arbitrage via dmmSwapCall:
    // receive 200 X from dmmSwap, get as much ETH from uniswap as we can, repay dmmSwap with minimum ETH, keep the rest!
    const arbitrageAmount = expandTo18Decimals(200);
    // instead of being 'hard-coded', the above value could be calculated optimally off-chain. this would be
    // better, but it'd be better yet to calculate the amount at runtime, on-chain. unfortunately, this requires a
    // swap-to-price calculation, which is a little tricky, and out of scope for the moment
    const ethPoolToken0 = await ethDmmPool.token0();
    const amount0 = ethPoolToken0 === ethPartner.address ? arbitrageAmount : new BN(0);
    const amount1 = ethPoolToken0 === ethPartner.address ? new BN(0) : arbitrageAmount;
    await ethDmmPool.swap(amount0, amount1, flashSwap.address, web3.eth.abi.encodeParameters(['uint'], [new BN(1)]), {
      from: trader,
      gasPrice: new BN(0)
    });

    const balanceAfter = await Helper.getBalancePromise(trader);
    Helper.assertGreater(balanceAfter, balanceBefore);
    // console.log(`profit = ${balanceAfter.sub(balanceBefore).toString()}`);
  });
});
