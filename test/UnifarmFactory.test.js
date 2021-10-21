const { use, expect } = require('chai')
const { ethers, waffle } = require('hardhat')
const { ecsign } = require('ethereumjs-util')
const { getApprovalDigest, getCreate2Address } = require('./utils/utilities')
const { solidity } = waffle

use(solidity)

const TEST_ADDRESSES = ['0x1000000000000000000000000000000000000000', '0x2000000000000000000000000000000000000000']
const { AddressZero } = ethers.constants
const UnifarmPair = require('../artifacts/contracts/UnifarmPair.sol/UnifarmPair.json')

describe('UnifarmFactory', () => {
  let wallet, other, trustedForwarder
  let factory
  let lpFee = 2
  let swapFee = 2
  let lpFeesInToken = true
  let swapFeesInToken = true

  beforeEach(async () => {
    ;[wallet, other, trustedForwarder] = await ethers.getSigners()

    const Factory = await ethers.getContractFactory('UnifarmFactory')
    factory = await Factory.deploy(
      wallet.address,
      trustedForwarder.address,
      lpFee,
      swapFee,
      lpFeesInToken,
      swapFeesInToken
    )
  })

  it('feeTo, feeToSetter, allPairsLength', async () => {
    expect(await factory.feeTo()).to.equal(wallet.address)
    expect(await factory.allPairsLength()).to.equal(0)
  })

  async function createPair(tokens) {
    const bytecode = UnifarmPair.bytecode
    const create2Address = getCreate2Address(factory.address, tokens[0], tokens[1], bytecode)
    await expect(factory.createPair(...tokens))
      .to.emit(factory, 'PairCreated')
      .withArgs(TEST_ADDRESSES[0], TEST_ADDRESSES[1], create2Address, 1)

    await expect(factory.createPair(...tokens)).to.be.reverted // Unifarm: PAIR_EXISTS
    await expect(factory.createPair(...tokens.slice().reverse())).to.be.reverted // Unifarm: PAIR_EXISTS
    expect(await factory.getPair(...tokens)).to.eq(create2Address)
    expect(await factory.getPair(...tokens.slice().reverse())).to.eq(create2Address)
    expect(await factory.allPairs(0)).to.eq(create2Address)
    expect(await factory.allPairsLength()).to.eq(1)

    const UnifarmPairContract = await ethers.getContractFactory('UnifarmPair')
    const pair = await UnifarmPairContract.attach(create2Address)

    expect(await pair.factory()).to.eq(factory.address)
    expect(await pair.token0()).to.eq(TEST_ADDRESSES[0])
    expect(await pair.token1()).to.eq(TEST_ADDRESSES[1])
  }

  it('createPair', async () => {
    await createPair(TEST_ADDRESSES)
  })

  it('createPair:reverse', async () => {
    await createPair(TEST_ADDRESSES.slice().reverse())
  })

  it('createPair:gas', async () => {
    const tx = await factory.createPair(...TEST_ADDRESSES)
    const receipt = await tx.wait()
    expect(receipt.gasUsed).to.gte(3234107)
  })

  it('setFeeTo', async () => {
    await expect(factory.connect(other).setFeeTo(other.address)).to.be.revertedWith('Ownable: caller is not the owner')
    await factory.setFeeTo(wallet.address)
    expect(await factory.feeTo()).to.eq(wallet.address)
  })

  it('updateLPFeeConfig', async () => {
    await expect(
      factory.connect(other).updateLPFeeConfig(wallet.address, false, lpFee, lpFeesInToken)
    ).to.be.revertedWith('Ownable: caller is not the owner')
    await createPair(TEST_ADDRESSES)
    await factory.updateLPFeeConfig(factory.getPair(...TEST_ADDRESSES), false, lpFee, lpFeesInToken)
    expect(await factory.feeTo()).to.eq(wallet.address)
  })

  it('updateSwapFeeConfig', async () => {
    await expect(factory.connect(other).updateSwapFeeConfig(wallet.address, lpFeesInToken, lpFee)).to.be.revertedWith(
      'Ownable: caller is not the owner'
    )
    await createPair(TEST_ADDRESSES)
    await factory.updateSwapFeeConfig(factory.getPair(...TEST_ADDRESSES), lpFeesInToken, lpFee)
    expect(await factory.feeTo()).to.eq(wallet.address)
  })
})
