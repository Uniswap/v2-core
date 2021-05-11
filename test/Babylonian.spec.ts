import chai, {expect} from 'chai'
import {Contract, BigNumber, constants} from 'ethers'
import {solidity, MockProvider, deployContract} from 'ethereum-waffle'

import BabylonianTest from '../build/BabylonianTest.json'

chai.use(solidity)

const overrides = {
  gasLimit: 9999999,
}

describe('Babylonian', () => {
  const provider = new MockProvider({
    ganacheOptions: {
      hardfork: 'istanbul',
      mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
      gasLimit: 9999999,
    },
  })
  const [wallet] = provider.getWallets()

  let babylonian: Contract
  before('deploy BabylonianTest', async () => {
    babylonian = await deployContract(wallet, BabylonianTest, [], overrides)
  })

  describe('#sqrt', () => {
    it('works for 0-99', async () => {
      for (let i = 0; i < 100; i++) {
        expect(await babylonian.sqrt(i)).to.eq(Math.floor(Math.sqrt(i)))
      }
    })

    it('product of numbers close to max uint112', async () => {
      const max = BigNumber.from(2).pow(112).sub(1)
      expect(await babylonian.sqrt(max.mul(max))).to.eq(max)
      const maxMinus1 = max.sub(1)
      expect(await babylonian.sqrt(maxMinus1.mul(maxMinus1))).to.eq(maxMinus1)
      const maxMinus2 = max.sub(2)
      expect(await babylonian.sqrt(maxMinus2.mul(maxMinus2))).to.eq(maxMinus2)

      expect(await babylonian.sqrt(max.mul(maxMinus1))).to.eq(maxMinus1)
      expect(await babylonian.sqrt(max.mul(maxMinus2))).to.eq(maxMinus2)
      expect(await babylonian.sqrt(maxMinus1.mul(maxMinus2))).to.eq(maxMinus2)
    })

    it('max uint256', async () => {
      const expected = BigNumber.from(2).pow(128).sub(1)
      expect(await babylonian.sqrt(constants.MaxUint256)).to.eq(expected)
    })

    it('gas cost', async () => {
      expect(await babylonian.getGasCostOfSqrt(150)).to.eq(678)
    })

    it('gas cost of large number', async () => {
      expect(await babylonian.getGasCostOfSqrt(BigNumber.from(2).pow(150))).to.eq(720)
    })

    it('gas cost of max uint', async () => {
      expect(await babylonian.getGasCostOfSqrt(BigNumber.from(2).pow(256).sub(1))).to.eq(798)
    })
  })
})
