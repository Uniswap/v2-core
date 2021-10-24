const { use, expect } = require('chai')
const { ethers, waffle } = require('hardhat')
const { solidity } = waffle
use(solidity)

const { AddressZero } = ethers.constants
const { expandTo18Decimals, encodePrice } = require('./utils/utilities')
const { BigNumber } = require('@ethersproject/bignumber')

const MINIMUM_LIQUIDITY = ethers.BigNumber.from(10).pow(3)
const TOTAL_SUPPLY = expandTo18Decimals('10000')

describe('UnifarmPair', () => {
  let wallet, other, trustedForwarder
  let factory
  let lpFee = 3
  let swapFee = 3
  let lpFeesInToken = true
  let swapFeesInToken = true
  let token0
  let token1

  beforeEach(async () => {
    ;[wallet, other, trustedForwarder] = await ethers.getSigners()

    const Factory = await ethers.getContractFactory('UnifarmFactory')
    const UnifarmPairContract = await ethers.getContractFactory('UnifarmPair')
    const Token = await ethers.getContractFactory('ERC20')
    const tokenA = await Token.deploy(TOTAL_SUPPLY)
    const tokenB = await Token.deploy(TOTAL_SUPPLY)

    await tokenA.transfer(other.address, expandTo18Decimals('5000'))
    await tokenB.transfer(other.address, expandTo18Decimals('5000'))

    factory = await Factory.deploy(
      wallet.address,
      trustedForwarder.address,
      lpFee,
      swapFee,
      lpFeesInToken,
      swapFeesInToken
    )

    await factory.createPair(tokenA.address, tokenB.address)
    let pairAddress = await factory.getPair(tokenA.address, tokenB.address)
    pair = await UnifarmPairContract.attach(pairAddress)

    const token0Address = await pair.token0()
    token0 = tokenA.address === token0Address ? tokenA : tokenB
    token1 = tokenA.address === token0Address ? tokenB : tokenA
  })

  it('mint', async () => {
    const token0Amount = BigNumber.from(expandTo18Decimals(1))
    const token1Amount = BigNumber.from(expandTo18Decimals(4))
    await token0.transfer(pair.address, token0Amount)
    await token1.transfer(pair.address, token1Amount)

    const token1WithoutFees = token1Amount.mul(1000 - lpFee).div(1000)
    const token0WithoutFees = token0Amount.mul(1000 - lpFee).div(1000)

    //deduct fees and min liquidity
    const expectedLiquidity = BigNumber.from(expandTo18Decimals(2)).sub(expandTo18Decimals(lpFee * 2).div(1000))

    await expect(pair.mint(wallet.address))
      .to.emit(pair, 'Transfer')
      .withArgs(AddressZero, AddressZero, MINIMUM_LIQUIDITY)
      .to.emit(pair, 'Sync')
      .withArgs(token0WithoutFees, token1WithoutFees)
      .to.emit(pair, 'Mint')
      .withArgs(wallet.address, token0WithoutFees, token1WithoutFees)

    expect(await pair.totalSupply()).to.eq(expectedLiquidity.toString())
    expect(await pair.balanceOf(wallet.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY))
    expect(await token0.balanceOf(pair.address)).to.eq(token0WithoutFees)
    expect(await token1.balanceOf(pair.address)).to.eq(token1WithoutFees)
    const reserves = await pair.getReserves()
    expect(reserves[0]).to.eq(token0WithoutFees)
    expect(reserves[1]).to.eq(token1WithoutFees)
  })

  it('burn', async () => {
    const token0Amount = BigNumber.from(expandTo18Decimals(1))
    const token1Amount = BigNumber.from(expandTo18Decimals(4))
    await token0.transfer(pair.address, token0Amount)
    await token1.transfer(pair.address, token1Amount)

    const token1WithoutFees = token1Amount.mul(1000 - lpFee).div(1000)
    const token0WithoutFees = token0Amount.mul(1000 - lpFee).div(1000)

    //deduct fees and min liquidity
    const expectedLiquidity = BigNumber.from(expandTo18Decimals(2)).sub(expandTo18Decimals(lpFee * 2).div(1000))

    await expect(pair.mint(wallet.address))
      .to.emit(pair, 'Transfer')
      .withArgs(AddressZero, AddressZero, MINIMUM_LIQUIDITY)
      .to.emit(pair, 'Sync')
      .withArgs(token0WithoutFees, token1WithoutFees)
      .to.emit(pair, 'Mint')
      .withArgs(wallet.address, token0WithoutFees, token1WithoutFees)
    await expect(pair.burn(wallet.address)).to.emit(pair, 'Burn')
  })

  async function addLiquidity(token0Amount, token1Amount, signer) {
    await token0.connect(signer).transfer(pair.address, token0Amount)
    await token1.connect(signer).transfer(pair.address, token1Amount)
    await pair.connect(signer).mint(signer.address)
  }

  const swapTestCases = [
    [1, 5, 10, '1662497915624478906'],
    [1, 10, 5, '453305446940074565'],

    [2, 5, 10, '2851015155847869602'],
    [2, 10, 5, '831248957812239453'],

    [1, 10, 10, '906610893880149131'],
    [1, 100, 100, '987158034397061298'],
    [1, 1000, 1000, '996006981039903216']
  ].map(a => a.map(n => (typeof n === 'string' ? ethers.BigNumber.from(n) : expandTo18Decimals(n))))
  swapTestCases.forEach((swapTestCase, i) => {
    it(`getInputPrice:${i}`, async () => {
      const [swapAmount, token0Amount, token1Amount, expectedOutputAmount] = swapTestCase
      await addLiquidity(token0Amount, token1Amount, other)
      await token0.transfer(pair.address, swapAmount)
      await pair.swap(0, expectedOutputAmount, wallet.address, '0x')
    })
  })

  const optimisticTestCases = [
    ['997000000000000000', 5, 10, 1], // given amountIn, amountOut = floor(amountIn * .997)
    ['997000000000000000', 10, 5, 1],
    ['997000000000000000', 5, 5, 1],
    [1, 5, 5, '1003009027081243732'] // given amountOut, amountIn = ceiling(amountOut / .997)
  ].map(a => a.map(n => (typeof n === 'string' ? ethers.BigNumber.from(n) : expandTo18Decimals(n))))
  optimisticTestCases.forEach((optimisticTestCase, i) => {
    it(`optimistic:${i}`, async () => {
      const [outputAmount, token0Amount, token1Amount, inputAmount] = optimisticTestCase
      await addLiquidity(token0Amount, token1Amount, other)
      await token0.transfer(pair.address, inputAmount)
      await pair.swap(outputAmount, 0, wallet.address, '0x')
    })
  })

  it('swap:gas', async () => {
    const token0Amount = expandTo18Decimals(5)
    const token1Amount = expandTo18Decimals(10)
    await addLiquidity(token0Amount, token1Amount, other)

    // ensure that setting price{0,1}CumulativeLast for the first time doesn't affect our gas math
    await ethers.provider.send('evm_mine')
    await pair.sync()

    const swapAmount = expandTo18Decimals(1)
    const expectedOutputAmount = ethers.BigNumber.from('453305446940074565')
    await token1.transfer(pair.address, swapAmount)
    await ethers.provider.send('evm_mine')

    const tx = await pair.swap(expectedOutputAmount, 0, wallet.address, '0x')
    const receipt = await tx.wait()
    expect(receipt.gasUsed).to.gte(73462)
  })

  describe('should swap for various liquidity levels in a pool', () => {
    // taking liquidity precision as 100000
    const percentage = [1, 10, 100, 1000, 2000, 10000, 20000, 30000, 40000, 50000, 80000, 100000]
    const token0Amount = BigNumber.from(expandTo18Decimals(10))
    const token1Amount = BigNumber.from(expandTo18Decimals(10))
    const token1WithoutFees = token1Amount.mul(1000 - lpFee).div(1000)
    const token0WithoutFees = token0Amount.mul(1000 - lpFee).div(1000)
    let reserves

    beforeEach(async () => {
      await token0.transfer(pair.address, token0Amount)
      await token1.transfer(pair.address, token1Amount)

      await addLiquidity(token0Amount, token1Amount, other)

      reserves = await pair.getReserves()

      await ethers.provider.send('evm_mine')
      await pair.sync()
    })

    for (let index = 0; index < percentage.length; index++) {
      const swapAmount = token0WithoutFees.mul(percentage[index]).div(100000)

      it(`(swap ${swapAmount}`, async () => {
        await token0.transfer(pair.address, swapAmount)
        await ethers.provider.send('evm_mine')

        const amountInWithFee = swapAmount.mul(997)
        const numerator = amountInWithFee.mul(reserves[1])
        const denominator = reserves[0].mul(1000).add(amountInWithFee)
        const amountOut = numerator.div(denominator)

        await expect(pair.swap(0, amountOut, wallet.address, '0x'))
          .to.emit(pair, 'Swap')
          .withArgs(wallet.address, swapAmount, 0, 0, amountOut, wallet.address)
      })
    }
  })

  it('skim', async () => {
    await expect(pair.connect(other).skim(AddressZero)).to.be.revertedWith('Unifarm: to ZERO ADDRESS')
    await pair.skim(wallet.address)
    expect().to.eq()
  })

  it('sync', async () => {
    await pair.sync()
    expect().to.eq()
  })
})
