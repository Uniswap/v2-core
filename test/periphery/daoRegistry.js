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

  it('add pair to registry', async () => {
    await factory.createPair(token0.address, token1.address, new BN(20000));
    await factory.createPair(token0.address, token1.address, new BN(30000));

    const pairs = await factory.getPairs(token0.address, token1.address);
    Helper.assertEqual(pairs.length, new BN(2), 'unexpected pairs length');

    // revert if add invalid pair
    await expectRevert(
      registry.addPair(token0.address, token1.address, accounts[2], true, {from: owner}),
      'Registry: INVALID_PAIR'
    );
    // revert if not owner
    await expectRevert(
      registry.addPair(token0.address, token1.address, pairs[0], true, {from: accounts[0]}),
      'Ownable: caller is not the owner'
    );
    let result = await registry.addPair(token0.address, token1.address, pairs[0], true, {from: owner});
    await expectEvent(result, 'AddPair', {
      token0: token0.address,
      token1: token1.address,
      pair: pairs[0],
      isAdd: true
    });

    let registeredPairs = await registry.getPairs(token0.address, token1.address);
    Helper.assertEqualArray(registeredPairs, [pairs[0]], 'unexpected registeredPairs');
    // add 1 more pair
    await registry.addPair(token0.address, token1.address, pairs[1], true, {from: owner});
    registeredPairs = await registry.getPairs(token0.address, token1.address);
    Helper.assertEqualArray(registeredPairs, pairs, 'unexpected registeredPairs');

    // remove pair
    await registry.addPair(token0.address, token1.address, pairs[1], false, {from: owner});
    registeredPairs = await registry.getPairs(token0.address, token1.address);
    Helper.assertEqualArray(registeredPairs, [pairs[0]], 'unexpected registeredPairs');
  });
});
