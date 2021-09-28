const { use, expect } = require('chai')
const { ethers, waffle } = require('hardhat')
const { ecsign } = require('ethereumjs-util')
const { getApprovalDigest } = require('./utils/utilities')
const { solidity } = waffle

use(solidity)
const { hexlify, keccak256, defaultAbiCoder, toUtf8Bytes } = ethers.utils
const { MaxUint256 } = ethers.constants

const TOTAL_SUPPLY = ethers.BigNumber.from('10000')
const TEST_AMOUNT = ethers.BigNumber.from('10')
const HARDHAT_DEFAULT_CHAIN_ID = 31337

describe('UnifarmERC20', function() {
  let wallet, other
  let token

  beforeEach(async () => {
    permitWallet = ethers.Wallet.createRandom()
    ;[wallet, other] = await ethers.getSigners()

    const Token = await ethers.getContractFactory('ERC20')
    token = await Token.deploy(TOTAL_SUPPLY)
  })

  it('name, symbol, decimals, totalSupply, balanceOf, DOMAIN_SEPARATOR, PERMIT_TYPEHASH', async () => {
    const name = await token.name()
    expect(name).to.equal('Unifarm Liquidity Token')
    expect(await token.symbol()).to.equal('UFARM-LP')
    expect(await token.decimals()).to.equal(18)
    expect(await token.totalSupply()).to.be.equal(ethers.BigNumber.from(TOTAL_SUPPLY))
    expect(await token.balanceOf(wallet.address)).to.equal(ethers.BigNumber.from(TOTAL_SUPPLY))
    expect(await token.DOMAIN_SEPARATOR()).to.equal(
      keccak256(
        defaultAbiCoder.encode(
          ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
          [
            keccak256(
              toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')
            ),
            keccak256(toUtf8Bytes(name)),
            keccak256(toUtf8Bytes('1')),
            HARDHAT_DEFAULT_CHAIN_ID,
            token.address
          ]
        )
      )
    )
    expect(await token.PERMIT_TYPEHASH()).to.eq(
      keccak256(toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)'))
    )
  })

  it('approve', async () => {
    await expect(token.approve(other.address, TEST_AMOUNT))
      .to.emit(token, 'Approval')
      .withArgs(wallet.address, other.address, TEST_AMOUNT)
    expect(await token.allowance(wallet.address, other.address)).to.eq(TEST_AMOUNT)
  })

  it('transfer', async () => {
    await expect(token.transfer(other.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT)
    expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT))
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
  })

  it('transfer:fail', async () => {
    await expect(token.transfer(other.address, TOTAL_SUPPLY.add(1))).to.be.reverted // ds-math-sub-underflow
    await expect(token.connect(other).transfer(wallet.address, 1)).to.be.reverted // ds-math-sub-underflow
  })

  it('transferFrom', async () => {
    await token.approve(other.address, TEST_AMOUNT)
    await expect(token.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT)
    expect(await token.allowance(wallet.address, other.address)).to.eq(0)
    expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT))
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
  })

  it('transferFrom:max', async () => {
    await token.approve(other.address, MaxUint256)
    await expect(token.connect(other).transferFrom(wallet.address, other.address, TEST_AMOUNT))
      .to.emit(token, 'Transfer')
      .withArgs(wallet.address, other.address, TEST_AMOUNT)
    expect(await token.allowance(wallet.address, other.address)).to.eq(MaxUint256)
    expect(await token.balanceOf(wallet.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT))
    expect(await token.balanceOf(other.address)).to.eq(TEST_AMOUNT)
  })

  it('permit', async () => {
    const nonce = await token.nonces(permitWallet.address)
    const deadline = MaxUint256
    const digest = await getApprovalDigest(
      token,
      { owner: permitWallet.address, spender: wallet.address, value: TEST_AMOUNT },
      nonce,
      deadline
    )

    const { v, r, s } = ecsign(
      Buffer.from(digest.slice(2), 'hex'),
      Buffer.from(permitWallet.privateKey.slice(2), 'hex')
    )

    await expect(token.permit(permitWallet.address, wallet.address, TEST_AMOUNT, deadline, v, hexlify(r), hexlify(s)))
      .to.emit(token, 'Approval')
      .withArgs(permitWallet.address, wallet.address, TEST_AMOUNT)
    expect(await token.allowance(permitWallet.address, wallet.address)).to.eq(TEST_AMOUNT)
    expect(await token.nonces(permitWallet.address)).to.eq(1)
  })
})
