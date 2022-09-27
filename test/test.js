const { expect, use } = require('chai');
const { ethers, waffle } = require('hardhat');

use(waffle.solidity);

describe('All Tests', () => {
  describe('Factory', () => {
    /**
     * @type {import('ethers').Contract}
     */
    let factory;

    /**
     * @type {import('ethers').Contract}
     */
    let token1;

    /**
     * @type {import('ethers').Contract}
     */
    let token2;

    before(async () => {
      const Factory = await ethers.getContractFactory('QuasarFactory');
      factory = await Factory.deploy();
      factory = await factory.deployed();

      const TokenFactory = await ethers.getContractFactory('TestERC20');
      [token1, token2] = [await TokenFactory.deploy(ethers.utils.parseEther('3000')), await TokenFactory.deploy(ethers.utils.parseEther('3000'))];
      [token1, token2] = [await token1.deployed(), await token2.deployed()];
    });

    it('should allow the creation of pairs', async () => {
      await expect(factory.createPair(token1.address, token2.address)).to.emit(factory, 'PairCreated');
    });
  });
});
