const DaoRegistry = artifacts.require('DaoRegistry');
const DMMFactory = artifacts.require('DMMFactory');
const TestToken = artifacts.require('TestToken');

const {expectEvent, expectRevert, constants} = require('@openzeppelin/test-helpers');
const Helper = require('../helper');
const BN = web3.utils.BN;

let factory;
let registry;
let token0;
let token1;
let owner;

contract('DaoRegistry', accounts => {
  before('init', async () => {
    owner = accounts[1];

    let tokenA = await TestToken.new('test token A', 'A', Helper.MaxUint256);
    let tokenB = await TestToken.new('test token B', 'B', Helper.MaxUint256);
    [token0, token1] = new BN(tokenA.address).lt(new BN(tokenB.address)) ? [tokenA, tokenB] : [tokenB, tokenA];

    factory = await DMMFactory.new(accounts[0]);
    registry = await DaoRegistry.new(factory.address, {from: owner});
  });

  it('add pool to registry', async () => {
    await factory.createPool(token0.address, token1.address, new BN(20000));
    await factory.createPool(token0.address, token1.address, new BN(30000));

    const pools = await factory.getPools(token0.address, token1.address);
    Helper.assertEqual(pools.length, new BN(2), 'unexpected pools length');

    // revert if add invalid pool
    await expectRevert(
      registry.addPool(token0.address, token1.address, accounts[2], true, {from: owner}),
      'Registry: INVALID_POOL'
    );
    // revert if not owner
    await expectRevert(
      registry.addPool(token0.address, token1.address, pools[0], true, {from: accounts[0]}),
      'Ownable: caller is not the owner'
    );
    let result = await registry.addPool(token0.address, token1.address, pools[0], true, {from: owner});
    await expectEvent(result, 'AddPool', {
      token0: token0.address,
      token1: token1.address,
      pool: pools[0],
      isAdd: true
    });

    let registeredPools = await registry.getPools(token0.address, token1.address);
    Helper.assertEqualArray(registeredPools, [pools[0]], 'unexpected registeredPools');
    // add 1 more pool
    await registry.addPool(token0.address, token1.address, pools[1], true, {from: owner});
    registeredPools = await registry.getPools(token0.address, token1.address);
    Helper.assertEqualArray(registeredPools, pools, 'unexpected registeredPools');

    // remove pool
    await registry.addPool(token0.address, token1.address, pools[1], false, {from: owner});
    registeredPools = await registry.getPools(token0.address, token1.address);
    Helper.assertEqualArray(registeredPools, [pools[0]], 'unexpected registeredPools');
  });
});
