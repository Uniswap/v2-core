const { use, expect } = require('chai')
const { ethers, waffle } = require('hardhat')
const { solidity } = waffle
use(solidity)
const { expandTo18Decimals } = require('./utils/utilities')

const deploy = async (feeTo, fee) => {
  const AMMUtility = await ethers.getContractFactory('AMMUtility')
  return AMMUtility.deploy(feeTo, fee)
}

describe('AMMUtility', () => {
  let ammUtilityInstance, sourceToken, destToken
  let owner, user
  let fee = expandTo18Decimals(2).div(100) //0.02 ETH

  async function balanceOf(provider, account) {
    return await provider.getBalance(account)
  }

  beforeEach(async () => {
    ;[owner, user] = await ethers.getSigners()
    ammUtilityInstance = await deploy(owner.address, fee)

    const Token = await ethers.getContractFactory('ERC20')
    sourceToken = await Token.deploy(expandTo18Decimals('10000'))
    destToken = await Token.deploy(expandTo18Decimals('10000'))
  })

  it('swap', async () => {
    let zeroAddress = '0x0000000000000000000000000000000000000000'
    const amount = expandTo18Decimals(1)

    //transfer some tokens to user for swap
    await sourceToken.transfer(user.address, expandTo18Decimals(100))

    //approve tokens to swap
    await sourceToken.connect(user).approve(ammUtilityInstance.address, amount)

    //transfer dest token to allow transfer to send after swap
    await destToken.transfer(ammUtilityInstance.address, expandTo18Decimals(10))

    await expect(
      ammUtilityInstance.connect(user).swapTokens(user.address, zeroAddress, zeroAddress, amount, { value: fee })
    ).to.be.revertedWith('AMMUtility: Invalid token addresses')

    await expect(
      ammUtilityInstance
        .connect(user)
        .swapTokens(user.address, sourceToken.address, destToken.address, 0, { value: fee })
    ).to.be.revertedWith('AMMUtility: Invalid token amount')

    await expect(
      ammUtilityInstance.connect(user).swapTokens(user.address, sourceToken.address, destToken.address, amount)
    ).to.be.revertedWith('AMMUtility: Fee not received')

    await expect(
      ammUtilityInstance
        .connect(user)
        .swapTokens(user.address, sourceToken.address, sourceToken.address, amount, { value: fee })
    ).to.be.revertedWith('AMMUtility: Both address are same')

    await expect(
      ammUtilityInstance
        .connect(user)
        .swapTokens(user.address, sourceToken.address, destToken.address, amount, { value: fee })
    )
      .to.emit(ammUtilityInstance, 'TokenSwapExecuted')
      .withArgs(sourceToken.address, destToken.address, 1)
  })
})
