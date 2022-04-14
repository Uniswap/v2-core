const {artifacts} = require('hardhat');

const BN = web3.utils.BN;

const Helper = require('../test/helper');

const LiquidityMigrator = artifacts.require('LiquidityMigrator.sol');
const IDMMRouter02 = artifacts.require('IDMMRouter02.sol');
const IDMMFactory = artifacts.require('IDMMFactory.sol');
const TestToken = artifacts.require('TestToken.sol');
const MockFeeOnTransferERC20 = artifacts.require('MockFeeOnTransferERC20.sol');
const UniswapV2Factory = Helper.getTruffleContract('./node_modules/@uniswap/v2-core/build/UniswapV2Factory.json');
const UniswapV2Router = Helper.getTruffleContract('./node_modules/@uniswap/v2-periphery/build/UniswapV2Router02.json');
// const UniswapV2Pair = Helper.getTruffleContract('./node_modules/@uniswap/v2-core/build/UniswapV2Pair.json');

let migratorAddress;
let migrator;
let uniswapRouter;
let uniswapRouterAddress = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d';
let dmmRouter;
let dmmRouterAddress = '0xf9a856b7d8750c5d7f0aec4f586677bdfd9aaf40';

let uniswapFactor;
let pair;

let dmmFactory;

const wethAddress = '0xc778417e063141139fce010982780140aa0cd5ab';
let testTokenAddress = '0x094Eaec07f0a01C9fCca877A4E84cF2Bdc4A6f84';
let testToken;

let tokenWithFeeAddress = '0x7fA2718fDe395165f74d29939b72654F69ef5eba';
let tokenWithFee;

let deployer;

async function main () {
  const accounts = await web3.eth.getAccounts();
  // We get the contract to deploy

  deployer = accounts[0];
  console.log(`Deployer: ${deployer}`);

  gasPrice = new BN(10).mul(new BN(10).pow(new BN(9)));

  uniswapRouter = await UniswapV2Router.at(uniswapRouterAddress);
  console.log(`Uniswap Router: ${uniswapRouter.address}`);
  uniswapFactor = await UniswapV2Factory.at(await uniswapRouter.factory());
  console.log(`Uniswap Factory: ${uniswapFactor.address}`);
  dmmRouter = await IDMMRouter02.at(dmmRouterAddress);
  console.log(`Kyber DMM Router: ${dmmRouter.address}`);
  dmmFactory = await IDMMFactory.at(await dmmRouter.factory());
  console.log(`Kyber DMM Factory: ${dmmFactory.address}`);

  if (migratorAddress == undefined) {
    migrator = await LiquidityMigrator.new(dmmRouterAddress, {gasPrice: gasPrice});
    migratorAddress = migrator.address;
  } else {
    migrator = await LiquidityMigrator.at(migratorAddress);
  }
  console.log(`Migrator: ${migratorAddress}`);

  if (testTokenAddress == undefined) {
    // name/symbol/total_supply
    testToken = await TestToken.new('Test token', 'TST', new BN(10).pow(new BN(32)), {gasPrice: gasPrice});
    testTokenAddress = testToken.address;
  } else {
    testToken = await TestToken.at(testTokenAddress);
  }
  console.log(`Test token: ${testTokenAddress}`);

  let ethAmount = new BN(10).pow(new BN(17));
  let tokenAmount = ethAmount.mul(new BN(1604));

  await testToken.approve(uniswapRouterAddress, new BN(2).pow(new BN(255)), {gasPrice: gasPrice});
  console.log(`Approved`);

  if (tokenWithFeeAddress == undefined) {
    tokenWithFee = await MockFeeOnTransferERC20.new('Test Fee Token', 'FTST', new BN(10).pow(new BN(32)), {
      gasPrice: gasPrice
    });
    tokenWithFeeAddress = tokenWithFee.address;
  } else {
    tokenWithFee = await MockFeeOnTransferERC20.at(tokenWithFeeAddress);
  }
  console.log(`Token with fee: ${tokenWithFeeAddress}`);
  await tokenWithFee.approve(uniswapRouterAddress, new BN(2).pow(new BN(255)), {gasPrice: gasPrice});
  console.log(`Approved token with fee`);

  let deadline = new BN(10).pow(new BN(18));

  await uniswapRouter.addLiquidityETH(testTokenAddress, tokenAmount, 0, 0, deployer, deadline, {
    value: ethAmount,
    gasPrice: gasPrice
  });
  console.log(`Added liquidity ETH - token`);

  await uniswapRouter.addLiquidity(
    testTokenAddress,
    tokenWithFeeAddress,
    tokenAmount,
    tokenAmount.div(new BN(2)),
    0,
    0,
    deployer,
    deadline,
    {gasPrice: gasPrice}
  );
  console.log(`Added liquidity token with fee - token`);

  let tokenLpPairAddress = await uniswapFactor.getPair(wethAddress, testToken.address);
  let tokenLpPair = await TestToken.at(tokenLpPairAddress);

  await tokenLpPair.approve(migrator.address, new BN(2).pow(new BN(255)), {gasPrice: gasPrice});
  console.log(`Approved`);
  let balance = await tokenLpPair.balanceOf(deployer);
  console.log(`LP balance: ${balance.toString(10)}`);

  await migrator.migrateLpToDmmPool(
    tokenLpPairAddress,
    wethAddress,
    testToken.address,
    balance.div(new BN(2)),
    0,
    0,
    0,
    0,
    ['0x0000000000000000000000000000000000000000', 12345],
    deadline,
    {gasPrice: gasPrice, gas: 6000000}
  );
  console.log(`Migrated to new Kyber DMM pool`);

  // make a swap to change the rate in Uniswap
  await uniswapRouter.swapExactETHForTokens(0, [wethAddress, testToken.address], deployer, deadline, {
    value: ethAmount.div(new BN(10)),
    gasPrice: gasPrice,
    gas: 200000
  });
  let pools = await dmmFactory.getPools(wethAddress, testToken.address);
  console.log(`Kyber DMM pool for token: ${pools[0]}`);

  await migrator.migrateLpToDmmPool(
    tokenLpPairAddress,
    wethAddress,
    testToken.address,
    balance.div(new BN(2)),
    0,
    0,
    [pools[0], 0],
    deadline,
    {gasPrice: gasPrice, gas: 6000000}
  );

  console.log(`Migrated to existing pool: ${pools[0]}`);

  tokenLpPairAddress = await uniswapFactor.getPair(tokenWithFee.address, testToken.address);
  tokenLpPair = await TestToken.at(tokenLpPairAddress);
  console.log(`LP token with fee - token: ${tokenLpPair.address}`);
  await tokenLpPair.approve(migrator.address, new BN(2).pow(new BN(255)), {gasPrice: gasPrice});
  console.log(`Approved`);
  balance = await tokenLpPair.balanceOf(deployer);
  console.log(`LP balance token with fee - token: ${balance.toString(10)}`);

  await migrator.migrateLpToDmmPool(
    tokenLpPairAddress,
    tokenWithFee.address,
    testToken.address,
    balance.div(new BN(2)),
    0,
    0,
    ['0x0000000000000000000000000000000000000000', 23456],
    deadline,
    {gasPrice: gasPrice, gas: 6000000}
  );
  console.log(`Migrated to new Kyber DMM pool`);

  // make a swap to change the rate in Uniswap
  await uniswapRouter.swapExactTokensForTokensSupportingFeeOnTransferTokens(
    new BN(1000000),
    0,
    [tokenWithFee.address, testToken.address],
    deployer,
    deadline,
    {gasPrice: gasPrice, gas: 500000}
  );
  pools = await dmmFactory.getPools(tokenWithFee.address, testToken.address);
  console.log(`Kyber DMM pool for token: ${pools[0]}`);

  await migrator.migrateLpToDmmPool(
    tokenLpPairAddress,
    tokenWithFee.address,
    testToken.address,
    balance.div(new BN(2)),
    0,
    0,
    0,
    0,
    [pools[0], 0],
    deadline,
    {gasPrice: gasPrice, gas: 6000000}
  );

  console.log(`Migrated to existing pool: ${pools[0]}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
