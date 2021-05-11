import chai, {expect} from 'chai'
import {Contract, BigNumber, constants} from 'ethers'
import {solidity, MockProvider, deployContract} from 'ethereum-waffle'

import FullMathTest from '../build/FullMathTest.json'

chai.use(solidity)

const overrides = {
  gasLimit: 9999999,
}

describe('FullMath', () => {
  const provider = new MockProvider({
    ganacheOptions: {
      hardfork: 'istanbul',
      mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
      gasLimit: 9999999,
    },
  })
  const [wallet] = provider.getWallets()

  let fm: Contract
  before('deploy FullMathTest', async () => {
    fm = await deployContract(wallet, FullMathTest, [], overrides)
  })

  describe('#mulDiv', () => {
    const Q128 = BigNumber.from(2).pow(128)
    it('accurate without phantom overflow', async () => {
      const result = Q128.div(3)
      expect(
        await fm.mulDiv(
          Q128,
          /*0.5=*/ BigNumber.from(50).mul(Q128).div(100),
          /*1.5=*/ BigNumber.from(150).mul(Q128).div(100)
        )
      ).to.eq(result)

      expect(
        await fm.mulDivRoundingUp(
          Q128,
          /*0.5=*/ BigNumber.from(50).mul(Q128).div(100),
          /*1.5=*/ BigNumber.from(150).mul(Q128).div(100)
        )
      ).to.eq(result.add(1))
    })

    it('accurate with phantom overflow', async () => {
      const result = BigNumber.from(4375).mul(Q128).div(1000)
      expect(await fm.mulDiv(Q128, BigNumber.from(35).mul(Q128), BigNumber.from(8).mul(Q128))).to.eq(result)
      expect(await fm.mulDivRoundingUp(Q128, BigNumber.from(35).mul(Q128), BigNumber.from(8).mul(Q128))).to.eq(result)
    })

    it('accurate with phantom overflow and repeating decimal', async () => {
      const result = BigNumber.from(1).mul(Q128).div(3)
      expect(await fm.mulDiv(Q128, BigNumber.from(1000).mul(Q128), BigNumber.from(3000).mul(Q128))).to.eq(result)
      expect(await fm.mulDivRoundingUp(Q128, BigNumber.from(1000).mul(Q128), BigNumber.from(3000).mul(Q128))).to.eq(
        result.add(1)
      )
    })
  })
})
