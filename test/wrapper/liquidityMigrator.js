const Helper = require('../helper');
const {MaxUint256, ethAddress, expandTo18Decimals, MINIMUM_LIQUIDITY} = require('../helper');
const BN = web3.utils.BN;
const {ecsign} = require('ethereumjs-util');
const {expectRevert, expectEvent} = require('@openzeppelin/test-helpers');

const DMMFactory = artifacts.require('DMMFactory');
const DMMPool = artifacts.require('DMMPool');
const FeeToken = artifacts.require('MockFeeOnTransferERC20');
const TestToken = artifacts.require('TestToken');
const WETH = artifacts.require('WETH9');
const ERC20Permit = artifacts.require('MockERC20Permit');

const DMMRouter02 = artifacts.require('DMMRouter02');

const LiquidityMigrator = artifacts.require('LiquidityMigrator.sol');

const UniswapV2Pair = Helper.getTruffleContract('./node_modules/@uniswap/v2-core/build/UniswapV2Pair.json');
const UniswapV2Factory = Helper.getTruffleContract('./node_modules/@uniswap/v2-core/build/UniswapV2Factory.json');
const UniswapV2Router = Helper.getTruffleContract('./node_modules/@uniswap/v2-periphery/build/UniswapV2Router02.json');

const deadline = new BN(2).pow(new BN(255));
const zeroAddress = '0x0000000000000000000000000000000000000000';

let feeToken;
let normalToken;

let dmmFactory;
let dmmRouter;
let pool;
let weth;
let tokenPool;

let uniswapFactory;
let uniswapRouter;

let feeSetter;
let liquidityProvider;

let migrator;

let token0s;
let token1s;

contract('LiquidityMigrator', accounts => {
  before('set accounts', async () => {
    feeSetter = accounts[0];
    liquidityProvider = accounts[3];
    // key from hardhat.config.js
    liquidityProviderPkKey = '0xee9d129c1997549ee09c0757af5939b2483d80ad649a0eda68e8b0357ad11131';
    trader = accounts[2];
    weth = await WETH.new();
  });

  before('setup dmmFactory and dmmRouter', async () => {
    feeToken = await FeeToken.new('feeOnTransfer Token', 'FOT', expandTo18Decimals(1000000), {
      from: liquidityProvider
    });
    normalToken = await TestToken.new('test', 't1', expandTo18Decimals(1000000), {from: liquidityProvider});

    dmmFactory = await DMMFactory.new(feeSetter);
    dmmRouter = await DMMRouter02.new(dmmFactory.address, weth.address);

    uniswapFactory = await UniswapV2Factory.new(feeSetter);
    uniswapRouter = await UniswapV2Router.new(uniswapFactory.address, weth.address);

    migrator = await LiquidityMigrator.new(dmmRouter.address);

    await approveAllowance([weth, feeToken, normalToken], uniswapRouter.address, deadline, liquidityProvider);
    await approveAllowance([weth, feeToken, normalToken], dmmRouter.address, deadline, liquidityProvider);

    await weth.deposit({value: expandTo18Decimals(5), from: liquidityProvider});

    // add weth - normal token
    await addLiquidity(
      weth.address,
      normalToken.address,
      expandTo18Decimals(1),
      expandTo18Decimals(1000),
      liquidityProvider
    );
    // add weth - fee token
    await addLiquidity(
      weth.address,
      feeToken.address,
      expandTo18Decimals(1),
      expandTo18Decimals(1500),
      liquidityProvider
    );
    // add normal token - fee token
    await addLiquidity(
      normalToken.address,
      feeToken.address,
      expandTo18Decimals(1200),
      expandTo18Decimals(15000),
      liquidityProvider
    );

    token0s = [weth, feeToken, normalToken];
    token1s = [normalToken, weth, feeToken];
  });

  async function approveAllowance (tokens, spender, amount, user) {
    for (let i = 0; i < tokens.length; i++) {
      await tokens[i].approve(spender, amount, {from: user});
    }
  }

  async function addLiquidity (tokenA, tokenB, amountA, amountB, liquidityProvider) {
    await uniswapRouter.addLiquidity(tokenA, tokenB, amountA, amountB, 0, 0, liquidityProvider, deadline, {
      from: liquidityProvider
    });
  }

  async function verifyMigrateEventAndData (
    tx,
    tokenA,
    tokenB,
    liquidity,
    ampBps,
    poolAddress,
    poolLength,
    lpToken,
    lpBalance,
    provider
  ) {
    expectEvent(tx, 'RemoveLiquidity', {
      tokenA: tokenA,
      tokenB: tokenB,
      uniPair: await uniswapFactory.getPair(tokenA, tokenB),
      liquidity: liquidity
    });
    expectEvent(tx, 'Migrated', {
      tokenA: tokenA,
      tokenB: tokenB
    });
    if (poolAddress == zeroAddress) {
      // verify new pool has been created
      Helper.assertEqual(poolLength.add(new BN(1)), await dmmFactory.getPoolsLength(tokenA, tokenB));
      let pool = await dmmFactory.getPoolAtIndex(tokenA, tokenB, poolLength);
      Helper.assertEqual(ampBps, await (await DMMPool.at(pool)).ampBps());
    } else {
      // no new pool added
      Helper.assertEqual(poolLength, await dmmFactory.getPoolsLength(tokenA, tokenB));
    }
    Helper.assertEqual(lpBalance.sub(liquidity), await lpToken.balanceOf(provider));
  }

  async function getSharesFromPool (poolAddress, tokenA, tokenB, user) {
    let token = await TestToken.at(poolAddress);
    let totalSupply = await token.totalSupply();
    let userBalance = await token.balanceOf(user);
    let balTokenA = await (await TestToken.at(tokenA)).balanceOf(poolAddress);
    balTokenA = balTokenA.mul(userBalance).div(totalSupply);
    let balTokenB = await (await TestToken.at(tokenB)).balanceOf(poolAddress);
    balTokenB = balTokenB.mul(userBalance).div(totalSupply);
    return [balTokenA, balTokenB];
  }

  let testSuites = ['weth - normal token', 'weth - fee token', 'normal token - fee token'];
  let feeOnTransfer = [false, true, true];

  for (let i = 0; i < testSuites.length; i++) {
    describe(`#migrateLpToDmmPool - ${testSuites[i]}`, async () => {
      before('set data', async () => {
        token0 = token0s[i];
        token1 = token1s[i];
      });

      it('migrate to new pool', async () => {
        let lpToken = await TestToken.at(await uniswapFactory.getPair(token0.address, token1.address));
        let lpBalance = await lpToken.balanceOf(liquidityProvider);

        let liquidity = new BN(lpBalance).div(new BN(10));

        // approve allowance
        await approveAllowance([lpToken], migrator.address, deadline, liquidityProvider);

        let poolLength = await dmmFactory.getPoolsLength(token0.address, token1.address);
        let tx = await migrator.migrateLpToDmmPool(
          lpToken.address,
          token0.address,
          token1.address,
          liquidity,
          0,
          0,
          0,
          0,
          [zeroAddress, 12345, [Helper.zeroBN, Helper.zeroBN]],
          deadline,
          {from: liquidityProvider}
        );
        await verifyMigrateEventAndData(
          tx,
          token0.address,
          token1.address,
          liquidity,
          12345,
          zeroAddress,
          poolLength,
          lpToken,
          lpBalance,
          liquidityProvider
        );
      });

      it('migrate to existing pool', async () => {
        let lpToken = await TestToken.at(await uniswapFactory.getPair(token0.address, token1.address));
        let lpBalance = await lpToken.balanceOf(liquidityProvider);

        let liquidity = new BN(lpBalance).div(new BN(10));

        // approve allowance
        await approveAllowance([lpToken], migrator.address, deadline, liquidityProvider);

        let poolAddress;
        let dmmPools = await dmmFactory.getPools(token0.address, token1.address);
        if (dmmPools.length > 0) {
          poolAddress = dmmPools[0];
        } else {
          // add new pool to dmm router
          await dmmRouter.addLiquidityNewPool(
            token0.address,
            token1.address,
            12345,
            new BN(10000),
            new BN(12000),
            0,
            0,
            liquidityProvider,
            deadline,
            {from: liquidityProvider}
          );
          dmmPools = await dmmFactory.getPools(token0.address, token1.address);
          poolAddress = dmmPools[0];
        }

        let tradeInfo = await (await DMMPool.at(poolAddress)).getTradeInfo();
        let vReserveRatioBounds;
        if (new BN(token0.address).lt(new BN(token1.address))) {
          vReserveRatioBounds = tradeInfo._vReserve1.mul(Helper.Q112).div(tradeInfo._vReserve0);
        } else {
          vReserveRatioBounds = tradeInfo._vReserve0.mul(Helper.Q112).div(tradeInfo._vReserve1);
        }

        let poolLength = await dmmFactory.getPoolsLength(token0.address, token1.address);
        let tx = await migrator.migrateLpToDmmPool(
          lpToken.address,
          token0.address,
          token1.address,
          liquidity,
          0,
          0,
          0,
          0,
          [poolAddress, 0, [vReserveRatioBounds, vReserveRatioBounds.add(new BN(1))]],
          deadline,
          {from: liquidityProvider}
        );
        await verifyMigrateEventAndData(
          tx,
          token0.address,
          token1.address,
          liquidity,
          0,
          poolAddress,
          poolLength,
          lpToken,
          lpBalance,
          liquidityProvider
        );
      });

      it('reverts invalid min amounts when removing liquidity', async () => {
        let lpToken = await TestToken.at(await uniswapFactory.getPair(token0.address, token1.address));
        let lpBalance = await lpToken.balanceOf(liquidityProvider);

        let liquidity = new BN(lpBalance).div(new BN(10));

        // approve allowance
        await approveAllowance([lpToken], migrator.address, deadline, liquidityProvider);

        let token0Amount;
        let token1Amount;
        let amountData = await getSharesFromPool(lpToken.address, token0.address, token1.address, liquidityProvider);
        token0Amount = amountData[0];
        token1Amount = amountData[1];

        await expectRevert(
          migrator.migrateLpToDmmPool(
            lpToken.address,
            token0.address,
            token1.address,
            liquidity,
            token0Amount.add(new BN(1)),
            liquidity,
            token0Amount.add(new BN(1)),
            0,
            [zeroAddress, 12345, [Helper.zeroBN, Helper.zeroBN]],
            deadline,
            {from: liquidityProvider}
          ),
          'Migratior: UNI_INSUFFICIENT_A_AMOUNT'
        );
        await expectRevert.unspecified(
          migrator.migrateLpToDmmPool(
            lpToken.address,
            token0.address,
            token1.address,
            liquidity,
            0,
            token1Amount.add(new BN(1)),
            0,
            token1Amount.add(new BN(1)),
            [zeroAddress, 12345, [Helper.zeroBN, Helper.zeroBN]],
            deadline,
            {from: liquidityProvider}
          ),
          'Migratior: UNI_INSUFFICIENT_B_AMOUNT'
        );
      });

      it('reverts invalid min amounts when adding liquidity', async () => {
        let lpToken = await TestToken.at(await uniswapFactory.getPair(token0.address, token1.address));
        let lpBalance = await lpToken.balanceOf(liquidityProvider);

        let liquidity = new BN(lpBalance).div(new BN(10));

        let token0Amount;
        let token1Amount;
        let amountData = await getSharesFromPool(lpToken.address, token0.address, token1.address, liquidityProvider);
        token0Amount = amountData[0];
        token1Amount = amountData[1];
        if (feeOnTransfer[i]) {
          token0Amount = token0Amount.mul(new BN(9900)).div(new BN(10000));
          token1Amount = token1Amount.mul(new BN(9900)).div(new BN(10000));
        }
        // approve allowance
        await approveAllowance([lpToken], migrator.address, deadline, liquidityProvider);

        await expectRevert.unspecified(
          migrator.migrateLpToDmmPool(
            lpToken.address,
            token0.address,
            token1.address,
            liquidity,
            token0Amount,
            token1Amount,
            token0Amount,
            token1Amount,
            [zeroAddress, 12345, [Helper.zeroBN, Helper.zeroBN]],
            deadline,
            {from: liquidityProvider}
          )
        );
      });

      it('reverts wrong token or wrong pool', async () => {
        let lpToken = await TestToken.at(await uniswapFactory.getPair(token0.address, token1.address));
        let lpBalance = await lpToken.balanceOf(liquidityProvider);

        let liquidity = new BN(lpBalance).div(new BN(10));

        let token0Amount;
        let token1Amount;
        let amountData = await getSharesFromPool(lpToken.address, token0.address, token1.address, liquidityProvider);
        token0Amount = amountData[0];
        token1Amount = amountData[1];
        if (feeOnTransfer[i]) {
          token0Amount = token0Amount.mul(new BN(9900)).div(new BN(10000));
          token1Amount = token1Amount.mul(new BN(9900)).div(new BN(10000));
        }
        // approve allowance
        await approveAllowance([lpToken], migrator.address, deadline, liquidityProvider);

        await expectRevert.unspecified(
          migrator.migrateLpToDmmPool(
            lpToken.address,
            token0.address,
            token0.address,
            liquidity,
            token0Amount,
            token1Amount,
            token0Amount,
            token1Amount,
            [zeroAddress, 12345, [Helper.zeroBN, Helper.zeroBN]],
            deadline,
            {from: liquidityProvider}
          )
        );
      });

      it('reverts expired', async () => {
        let lpToken = await TestToken.at(await uniswapFactory.getPair(token0.address, token1.address));
        let lpBalance = await lpToken.balanceOf(liquidityProvider);

        let liquidity = new BN(lpBalance).div(new BN(10));

        let token0Amount;
        let token1Amount;
        let amountData = await getSharesFromPool(lpToken.address, token0.address, token1.address, liquidityProvider);
        token0Amount = amountData[0];
        token1Amount = amountData[1];
        if (feeOnTransfer[i]) {
          token0Amount = token0Amount.mul(new BN(9900)).div(new BN(10000));
          token1Amount = token1Amount.mul(new BN(9900)).div(new BN(10000));
        }
        // approve allowance
        await approveAllowance([lpToken], migrator.address, deadline, liquidityProvider);

        await expectRevert(
          migrator.migrateLpToDmmPool(
            lpToken.address,
            token0.address,
            token1.address,
            liquidity,
            token0Amount,
            token1Amount,
            token0Amount,
            token1Amount,
            [zeroAddress, 12345, [Helper.zeroBN, Helper.zeroBN]],
            new BN(0),
            {from: liquidityProvider}
          ),
          'Migratior: EXPIRED'
        );
      });
    });
  }

  async function getPermitData (lpToken, liquidity, isApproveMax, deadline) {
    let permitToken = await UniswapV2Pair.at(lpToken.address);
    const nonce = await permitToken.nonces(liquidityProvider);
    const digest = await getApprovalDigest(
      permitToken,
      liquidityProvider,
      migrator.address,
      isApproveMax ? MaxUint256 : liquidity,
      nonce,
      deadline
    );
    const {v, r, s} = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(liquidityProviderPkKey.slice(2), 'hex'));
    return {v: v, r: r, s: s};
  }

  for (let i = 0; i < testSuites.length; i++) {
    describe(`#migrateLpToDmmPoolWithPermit - ${testSuites[i]}`, async () => {
      before('set data', async () => {
        token0 = token0s[i];
        token1 = token1s[i];
      });

      it('migrate to new pool', async () => {
        let lpToken = await TestToken.at(await uniswapFactory.getPair(token0.address, token1.address));
        let lpBalance = await lpToken.balanceOf(liquidityProvider);

        let liquidity = new BN(lpBalance).div(new BN(10));

        // reset allowance
        await approveAllowance([lpToken], migrator.address, 0, liquidityProvider);
        const data = await getPermitData(lpToken, liquidity, true, deadline);

        let poolLength = await dmmFactory.getPoolsLength(token0.address, token1.address);
        let tx = await migrator.migrateLpToDmmPoolWithPermit(
          lpToken.address,
          token0.address,
          token1.address,
          liquidity,
          0,
          0,
          0,
          0,
          [zeroAddress, 12345, [Helper.zeroBN, Helper.zeroBN]],
          deadline,
          [true, data.v, data.r, data.s],
          {from: liquidityProvider}
        );
        await verifyMigrateEventAndData(
          tx,
          token0.address,
          token1.address,
          liquidity,
          12345,
          zeroAddress,
          poolLength,
          lpToken,
          lpBalance,
          liquidityProvider
        );
        Helper.assertGreater(await lpToken.allowance(liquidityProvider, migrator.address), new BN(0));
      });

      it('migrate to existing pool', async () => {
        let lpToken = await TestToken.at(await uniswapFactory.getPair(token0.address, token1.address));
        let lpBalance = await lpToken.balanceOf(liquidityProvider);

        let liquidity = new BN(lpBalance).div(new BN(10));

        // reset allowance
        await approveAllowance([lpToken], migrator.address, 0, liquidityProvider);

        const data = await getPermitData(lpToken, liquidity, false, deadline);

        let poolAddress;
        let dmmPools = await dmmFactory.getPools(token0.address, token1.address);
        if (dmmPools.length > 0) {
          poolAddress = dmmPools[0];
        } else {
          // add new pool to dmm router
          await dmmRouter.addLiquidityNewPool(
            token0.address,
            token1.address,
            12345,
            new BN(1),
            new BN(12000),
            0,
            0,
            liquidityProvider,
            deadline,
            {from: liquidityProvider}
          );
          dmmPools = await dmmFactory.getPools(token0.address, token1.address);
          poolAddress = dmmPools[0];
        }

        let tradeInfo = await (await DMMPool.at(poolAddress)).getTradeInfo();
        let vReserveRatioBounds;
        if (new BN(token0.address).lt(new BN(token1.address))) {
          vReserveRatioBounds = tradeInfo._vReserve1.mul(Helper.Q112).div(tradeInfo._vReserve0);
        } else {
          vReserveRatioBounds = tradeInfo._vReserve0.mul(Helper.Q112).div(tradeInfo._vReserve1);
        }

        let poolLength = await dmmFactory.getPoolsLength(token0.address, token1.address);
        let tx = await migrator.migrateLpToDmmPoolWithPermit(
          lpToken.address,
          token0.address,
          token1.address,
          liquidity,
          0,
          0,
          0,
          0,
          [poolAddress, 0, [vReserveRatioBounds, vReserveRatioBounds.add(new BN(1))]],
          deadline,
          [false, data.v, data.r, data.s],
          {from: liquidityProvider}
        );
        await verifyMigrateEventAndData(
          tx,
          token0.address,
          token1.address,
          liquidity,
          0,
          poolAddress,
          poolLength,
          lpToken,
          lpBalance,
          liquidityProvider
        );
        Helper.assertEqual(await lpToken.allowance(liquidityProvider, migrator.address), new BN(0));
      });

      it('reverts invalid min amounts when removing liquidity', async () => {
        let lpToken = await TestToken.at(await uniswapFactory.getPair(token0.address, token1.address));
        let lpBalance = await lpToken.balanceOf(liquidityProvider);

        let liquidity = new BN(lpBalance).div(new BN(10));

        // reset allowance
        await approveAllowance([lpToken], migrator.address, 0, liquidityProvider);

        const data = await getPermitData(lpToken, liquidity, true, deadline);

        let token0Amount;
        let token1Amount;
        let amountData = await getSharesFromPool(lpToken.address, token0.address, token1.address, liquidityProvider);
        token0Amount = amountData[0];
        token1Amount = amountData[1];

        await expectRevert.unspecified(
          migrator.migrateLpToDmmPoolWithPermit(
            lpToken.address,
            token0.address,
            token1.address,
            liquidity,
            token0Amount.add(new BN(1)),
            0,
            0,
            0,
            [zeroAddress, 12345, [Helper.zeroBN, Helper.zeroBN]],
            deadline,
            [true, data.v, data.r, data.s],
            {from: liquidityProvider}
          )
        );
        await expectRevert.unspecified(
          migrator.migrateLpToDmmPool(
            lpToken.address,
            token0.address,
            token1.address,
            liquidity,
            0,
            token1Amount.add(new BN(1)),
            0,
            token1Amount.add(new BN(1)),
            [zeroAddress, 12345, [Helper.zeroBN, Helper.zeroBN]],
            deadline,
            {from: liquidityProvider}
          )
        );
        Helper.assertEqual(await lpToken.allowance(liquidityProvider, migrator.address), new BN(0));
      });

      it('reverts invalid min amounts when adding liquidity', async () => {
        let lpToken = await TestToken.at(await uniswapFactory.getPair(token0.address, token1.address));
        let lpBalance = await lpToken.balanceOf(liquidityProvider);

        let liquidity = new BN(lpBalance).div(new BN(10));

        let token0Amount;
        let token1Amount;
        let amountData = await getSharesFromPool(lpToken.address, token0.address, token1.address, liquidityProvider);
        token0Amount = amountData[0];
        token1Amount = amountData[1];
        if (feeOnTransfer[i]) {
          token0Amount = token0Amount.mul(new BN(9900)).div(new BN(10000));
          token1Amount = token1Amount.mul(new BN(9900)).div(new BN(10000));
        }
        // reset allowance
        await approveAllowance([lpToken], migrator.address, 0, liquidityProvider);
        const data = await getPermitData(lpToken, liquidity, false, deadline);

        await expectRevert.unspecified(
          migrator.migrateLpToDmmPoolWithPermit(
            lpToken.address,
            token0.address,
            token1.address,
            liquidity,
            token0Amount,
            token1Amount,
            token0Amount,
            token1Amount,
            [zeroAddress, 12345, [Helper.zeroBN, Helper.zeroBN]],
            deadline,
            [false, data.v, data.r, data.s],
            {from: liquidityProvider}
          )
        );
        Helper.assertEqual(await lpToken.allowance(liquidityProvider, migrator.address), new BN(0));
      });
    });
  }

  describe('special case: rate between 2 pools are different', async () => {
    before('set data', async () => {
      token0 = token0s[0];
      token1 = token1s[0];
    });

    it('migrate extract token', async () => {
      let lpToken = await TestToken.at(await uniswapFactory.getPair(token0.address, token1.address));
      let lpBalance = await lpToken.balanceOf(liquidityProvider);

      let liquidity = new BN(lpBalance).div(new BN(10));

      let totalSupply = await lpToken.totalSupply();
      let token0Amount = (await token0.balanceOf(lpToken.address)).mul(liquidity).div(totalSupply);
      let token1Amount = (await token1.balanceOf(lpToken.address)).mul(liquidity).div(totalSupply);

      await dmmRouter.addLiquidityNewPool(
        token0.address,
        token1.address,
        12345,
        Helper.expandTo18Decimals(1),
        Helper.expandTo18Decimals(2000),
        0,
        0,
        liquidityProvider,
        deadline,
        {from: liquidityProvider}
      );
      dmmPools = await dmmFactory.getPools(token0.address, token1.address);
      poolAddress = dmmPools[dmmPools.length - 1];
      console.log(poolAddress);

      let vReserveRatio = new BN(2000).mul(Helper.Q112);

      // reset allowance
      await approveAllowance([lpToken], migrator.address, 0, liquidityProvider);
      const data = await getPermitData(lpToken, liquidity, false, deadline);

      let tx = await migrator.migrateLpToDmmPoolWithPermit(
        lpToken.address,
        token0.address,
        token1.address,
        liquidity,
        token0Amount,
        token1Amount,
        token1Amount.div(new BN(2000)),
        token1Amount,
        [poolAddress, new BN(0), [vReserveRatio, vReserveRatio]],
        deadline,
        [false, data.v, data.r, data.s],
        {from: liquidityProvider}
      );
      Helper.assertEqual(await lpToken.allowance(liquidityProvider, migrator.address), new BN(0));

      await verifyMigrateEventAndData(
        tx,
        token0.address,
        token1.address,
        liquidity,
        12345,
        lpToken.address,
        new BN(dmmPools.length),
        lpToken,
        lpBalance,
        liquidityProvider
      );
    });
  });

  describe('#manual approve', async () => {
    it('test manual approve', async () => {
      let tokens = [weth.address, normalToken.address];
      let spenders = [accounts[1], accounts[2]];
      let amounts = [new BN(10000), new BN(0)];

      for (let i = 0; i < amounts.length; i++) {
        await expectRevert(
          migrator.manualApproveAllowance(tokens, spenders, amounts[i], {from: accounts[7]}),
          'Ownable: caller is not the owner'
        );

        await migrator.manualApproveAllowance(tokens, spenders, amounts[i]);
        for (let j = 0; j < tokens.length; j++) {
          for (let k = 0; k < spenders.length; k++) {
            Helper.assertEqual(
              amounts[i],
              await (await TestToken.at(tokens[j])).allowance(migrator.address, spenders[k])
            );
          }
        }
      }
    });
  });

  describe('#withdrawFund', async () => {
    it('test withdraw', async () => {
      migrator = await LiquidityMigrator.new(accounts[2]);
      await expectRevert(
        migrator.withdrawFund(zeroAddress, 0, {from: accounts[2]}),
        'Ownable: caller is not the owner'
      );

      let balanceOwner;

      let token = await TestToken.new('Test', 'TST', new BN(100000));
      await token.transfer(migrator.address, new BN(1000));
      await expectRevert.unspecified(migrator.withdrawFund(token.address, new BN(10000)));

      balanceOwner = await token.balanceOf(accounts[0]);
      await migrator.withdrawFund(token.address, new BN(1000), {gasPrice: new BN(0)});
      Helper.assertEqual(0, await token.balanceOf(migrator.address));
      Helper.assertEqual(balanceOwner.add(new BN(1000)), await token.balanceOf(accounts[0]));
    });
  });

  describe('#constrcutor', async () => {
    it('test constructor', async () => {
      await expectRevert(LiquidityMigrator.new(zeroAddress), 'Migrator: INVALID_ROUTER');
      let _migrator = await LiquidityMigrator.new(accounts[2]);
      Helper.assertEqual(accounts[2], await _migrator.dmmRouter());
    });
  });
});

async function getApprovalDigest (token, owner, spender, value, nonce, deadline) {
  const domainSeparator = await token.DOMAIN_SEPARATOR();

  const PERMIT_TYPEHASH = '0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9';
  const tmp = web3.utils.soliditySha3(
    web3.eth.abi.encodeParameters(
      ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
      [PERMIT_TYPEHASH, owner, spender, value, nonce, deadline]
    )
  );
  return web3.utils.soliditySha3(
    '0x' +
      Buffer.concat([
        Buffer.from('1901', 'hex'),
        Buffer.from(domainSeparator.slice(2), 'hex'),
        Buffer.from(tmp.slice(2), 'hex')
      ]).toString('hex')
  );
}
