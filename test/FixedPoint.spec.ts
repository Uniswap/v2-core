import chai, {expect} from 'chai'
import {Contract, BigNumber} from 'ethers'
import {solidity, MockProvider, deployContract} from 'ethereum-waffle'

import FixedPointTest from '../build/FixedPointTest.json'

chai.use(solidity)

const overrides = {
  gasLimit: 9999999,
}

const Q112 = BigNumber.from(2).pow(112)

describe('FixedPoint', () => {
  const provider = new MockProvider({
    ganacheOptions: {
      hardfork: 'istanbul',
      mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
      gasLimit: 9999999,
    },
  })
  const [wallet] = provider.getWallets()

  let fixedPoint: Contract
  before('deploy FixedPointTest', async () => {
    fixedPoint = await deployContract(wallet, FixedPointTest, [], overrides)
  })

  describe('#encode', () => {
    it('shifts left by 112', async () => {
      expect((await fixedPoint.encode('0x01'))[0]).to.eq(Q112.toHexString())
    })
    it('will not take >uint112(-1)', async () => {
      expect(() => fixedPoint.encode(BigNumber.from(2).pow(113).sub(1))).to.throw
    })
  })

  describe('#encode144', () => {
    it('shifts left by 112', async () => {
      expect((await fixedPoint.encode144('0x01'))[0]).to.eq(Q112.toHexString())
    })
    it('will not take >uint144(-1)', async () => {
      expect(() => fixedPoint.encode144(BigNumber.from(2).pow(145).sub(1))).to.throw
    })
  })

  describe('#decode', () => {
    it('shifts right by 112', async () => {
      expect(await fixedPoint.decode([BigNumber.from(3).mul(Q112)])).to.eq(BigNumber.from(3))
    })
    it('will not take >uint224(-1)', async () => {
      expect(() => fixedPoint.decode([BigNumber.from(2).pow(225).sub(1)])).to.throw
    })
  })

  describe('#decode144', () => {
    it('shifts right by 112', async () => {
      expect(await fixedPoint.decode([BigNumber.from(3).mul(Q112)])).to.eq(BigNumber.from(3))
    })

    it('will not take >uint256(-1)', async () => {
      expect(() => fixedPoint.decode([BigNumber.from(2).pow(257).sub(1)])).to.throw
    })
  })

  describe('#mul', () => {
    it('works for 0', async () => {
      expect((await fixedPoint.mul([0], 1))[0]).to.eq(0)
      expect((await fixedPoint.mul([1], 0))[0]).to.eq(0)
    })

    it('correct multiplication', async () => {
      expect((await fixedPoint.mul([BigNumber.from(3).mul(Q112)], BigNumber.from(2)))[0]).to.eq(
        BigNumber.from(3).mul(2).mul(Q112)
      )
    })

    it('overflow', async () => {
      await expect(fixedPoint.mul([BigNumber.from(1).mul(Q112)], BigNumber.from(2).pow(144))).to.be.revertedWith(
        'FixedPoint::mul: overflow'
      )
    })

    it('max of q112x112', async () => {
      expect((await fixedPoint.mul([BigNumber.from(2).pow(112)], BigNumber.from(2).pow(112)))[0]).to.eq(
        BigNumber.from(2).pow(224)
      )
    })

    it('max without overflow, largest fixed point', async () => {
      const maxMultiplier = BigNumber.from(2).pow(32)
      expect((await fixedPoint.mul([BigNumber.from(2).pow(224).sub(1)], maxMultiplier))[0]).to.eq(
        BigNumber.from('115792089237316195423570985008687907853269984665640564039457584007908834672640')
      )
      await expect(fixedPoint.mul([BigNumber.from(2).pow(224).sub(1)], maxMultiplier.add(1))).to.be.revertedWith(
        'FixedPoint::mul: overflow'
      )
    })

    it('max without overflow, smallest fixed point', async () => {
      const maxUint = BigNumber.from(2).pow(256).sub(1)
      expect((await fixedPoint.mul([BigNumber.from(1)], maxUint))[0]).to.eq(maxUint)
      await expect(fixedPoint.mul([BigNumber.from(2)], maxUint)).to.be.revertedWith('FixedPoint::mul: overflow')
    })
  })

  describe('#muli', () => {
    it('works for 0', async () => {
      expect(await fixedPoint.muli([BigNumber.from(0).mul(Q112)], BigNumber.from(1))).to.eq(BigNumber.from(0))
      expect(await fixedPoint.muli([BigNumber.from(1).mul(Q112)], BigNumber.from(0))).to.eq(BigNumber.from(0))
    })

    it('works for 3*2', async () => {
      expect(await fixedPoint.muli([BigNumber.from(3).mul(Q112)], BigNumber.from(2))).to.eq(BigNumber.from(6))
    })

    it('works for 3*-2', async () => {
      expect(await fixedPoint.muli([BigNumber.from(3).mul(Q112)], BigNumber.from(-2))).to.eq(BigNumber.from(-6))
    })

    it('max without overflow, largest int', async () => {
      const maxInt = BigNumber.from(2).pow(255).sub(1)
      expect(await fixedPoint.muli([BigNumber.from(1).mul(Q112)], maxInt)).to.be.eq(maxInt)

      const minInt = BigNumber.from(2).pow(255).mul(-1)
      await expect(fixedPoint.muli([BigNumber.from(1).mul(Q112)], minInt)).to.be.revertedWith(
        'FixedPoint::muli: overflow'
      )

      expect(await fixedPoint.muli([BigNumber.from(1).mul(Q112).sub(1)], minInt)).to.be.eq(
        '-57896044618658097711785492504343942776262393067508711251869655679775811829760'
      )
      expect(await fixedPoint.muli([BigNumber.from(1).mul(Q112)], minInt.add(1))).to.be.eq(minInt.add(1))
    })
    it('max without overflow, largest fixed point', async () => {
      const maxMultiplier = BigNumber.from(2)
        .pow(255 + 112)
        .div(BigNumber.from(2).pow(224).sub(1))
      expect(await fixedPoint.muli([BigNumber.from(2).pow(224).sub(1)], maxMultiplier)).to.eq(
        BigNumber.from('57896044618658097711785492504343953926634992332820282019728792003954417336320')
      )
      await expect(fixedPoint.muli([BigNumber.from(2).pow(224).sub(1)], maxMultiplier.add(1))).to.be.revertedWith(
        'FixedPoint::muli: overflow'
      )

      // negative versions
      expect(await fixedPoint.muli([BigNumber.from(2).pow(224).sub(1)], maxMultiplier.mul(-1))).to.eq(
        BigNumber.from('57896044618658097711785492504343953926634992332820282019728792003954417336320').mul(-1)
      )
      await expect(
        fixedPoint.muli([BigNumber.from(2).pow(224).sub(1)], maxMultiplier.add(1).mul(-1))
      ).to.be.revertedWith('FixedPoint::muli: overflow')
    })
  })

  describe('#muluq', () => {
    it('works for 0', async () => {
      expect((await fixedPoint.muluq([BigNumber.from(0)], [Q112]))[0]).to.eq(BigNumber.from(0))
      expect((await fixedPoint.muluq([Q112], [BigNumber.from(0)]))[0]).to.eq(BigNumber.from(0))
    })

    it('multiplies 3*2', async () => {
      expect((await fixedPoint.muluq([BigNumber.from(3).mul(Q112)], [BigNumber.from(2).mul(Q112)]))[0]).to.eq(
        BigNumber.from(3).mul(2).mul(Q112)
      )
    })
    function multiplyExpanded(self: BigNumber, other: BigNumber): BigNumber {
      const upper = self.shr(112).mul(other.shr(112))
      const lower = self.mask(112).mul(other.mask(112))
      const uppersLowero = self.shr(112).mul(other.mask(112))
      const upperoLowers = self.mask(112).mul(other.shr(112))
      return upper.mul(Q112).add(uppersLowero).add(upperoLowers).add(lower.div(Q112))
    }
    it('multiplies 4/3*4/3', async () => {
      const multiplier = BigNumber.from(4).mul(Q112).div(3)
      const expectedResult = multiplyExpanded(multiplier, multiplier)
      expect((await fixedPoint.muluq([multiplier], [multiplier]))[0]).to.eq(expectedResult)
      expect(expectedResult.add(1)).to.eq(BigNumber.from(16).mul(Q112).div(9)) // close to 16/9
    })

    it('overflow upper', async () => {
      const multiplier1 = Q112.mul(2)
      const multiplier2 = Q112.mul(Q112).div(2)
      await expect(fixedPoint.muluq([multiplier1], [multiplier2])).to.be.revertedWith(
        'FixedPoint::muluq: upper overflow'
      )
      expect((await fixedPoint.muluq([multiplier1.sub(1)], [multiplier2]))[0]).to.eq(
        multiplyExpanded(multiplier1.sub(1), multiplier2)
      )
      expect((await fixedPoint.muluq([multiplier1], [multiplier2.sub(1)]))[0]).to.eq(
        multiplyExpanded(multiplier1, multiplier2.sub(1))
      )
    })

    it('gas for short circuit where one multiplicand is 0', async () => {
      expect(await fixedPoint.getGasCostOfMuluq([BigNumber.from(0)], [BigNumber.from(30).mul(Q112)])).to.eq(671)
      expect(await fixedPoint.getGasCostOfMuluq([BigNumber.from(50).mul(Q112)], [BigNumber.from(0)])).to.eq(688)
    })

    it('gas', async () => {
      expect(await fixedPoint.getGasCostOfMuluq([BigNumber.from(30).mul(Q112)], [BigNumber.from(30).mul(Q112)])).to.eq(
        992
      )
    })
  })

  describe('#divuq', () => {
    it('works for 0 numerator', async () => {
      expect((await fixedPoint.divuq([BigNumber.from(0)], [Q112]))[0]).to.eq(BigNumber.from(0))
    })

    it('throws for 0 denominator', async () => {
      await expect(fixedPoint.divuq([Q112], [BigNumber.from(0)])).to.be.revertedWith(
        'FixedPoint::divuq: division by zero'
      )
    })

    it('equality 30/30', async () => {
      expect((await fixedPoint.divuq([BigNumber.from(30).mul(Q112)], [BigNumber.from(30).mul(Q112)]))[0]).to.eq(Q112)
    })

    it('divides 30/10', async () => {
      expect((await fixedPoint.divuq([BigNumber.from(30).mul(Q112)], [BigNumber.from(10).mul(Q112)]))[0]).to.eq(
        BigNumber.from(3).mul(Q112)
      )
    })

    it('divides 35/8', async () => {
      expect((await fixedPoint.divuq([BigNumber.from(35).mul(Q112)], [BigNumber.from(8).mul(Q112)]))[0]).to.eq(
        BigNumber.from(4375).mul(Q112).div(1000)
      )
    })

    it('divides 1/3', async () => {
      expect((await fixedPoint.divuq([BigNumber.from(1).mul(Q112)], [BigNumber.from(3).mul(Q112)]))[0]).to.eq(
        // this is max precision 0.3333 repeating
        '1730765619511609209510165443073365'
      )
    })

    it('divides 1e15/3e15 (long division, repeating)', async () => {
      expect(
        (
          await fixedPoint.divuq(
            [BigNumber.from(10).pow(15).mul(Q112)],
            [BigNumber.from(3).mul(BigNumber.from(10).pow(15)).mul(Q112)]
          )
        )[0]
      ).to.eq('1730765619511609209510165443073365')
    })

    it('boundary of full precision', async () => {
      const maxNumeratorFullPrecision = BigNumber.from(2).pow(144).sub(1)
      const minDenominatorFullPrecision = BigNumber.from('4294967296') // ceiling(uint144(-1) * Q112 / uint224(-1))

      expect((await fixedPoint.divuq([maxNumeratorFullPrecision], [minDenominatorFullPrecision]))[0]).to.eq(
        BigNumber.from('26959946667150639794667015087019630673637143213614752866474435543040')
      )

      await expect(
        fixedPoint.divuq([maxNumeratorFullPrecision.add(1)], [minDenominatorFullPrecision])
      ).to.be.revertedWith('FixedPoint::divuq: overflow')

      await expect(
        fixedPoint.divuq([maxNumeratorFullPrecision], [minDenominatorFullPrecision.sub(1)])
      ).to.be.revertedWith('FixedPoint::divuq: overflow')
    })

    it('precision', async () => {
      const numerator = BigNumber.from(2).pow(144)

      expect((await fixedPoint.divuq([numerator], [numerator.sub(1)]))[0]).to.eq(
        BigNumber.from('5192296858534827628530496329220096')
      )

      expect((await fixedPoint.divuq([numerator], [numerator.add(1)]))[0]).to.eq(
        BigNumber.from('5192296858534827628530496329220095')
      )
    })

    it('gas cost of dividend = divisor short circuit', async () => {
      expect(await fixedPoint.getGasCostOfDivuq([BigNumber.from(30).mul(Q112)], [BigNumber.from(30).mul(Q112)])).to.eq(
        698
      )
    })

    it('divuq overflow with smaller numbers', async () => {
      const numerator = BigNumber.from(2).pow(143)
      const denominator = BigNumber.from(2).pow(29)
      await expect(fixedPoint.divuq([numerator], [denominator])).to.be.revertedWith('FixedPoint::divuq: overflow')
    })

    it('divuq overflow with large numbers', async () => {
      const numerator = BigNumber.from(2).pow(145)
      const denominator = BigNumber.from(2).pow(32)
      await expect(fixedPoint.divuq([numerator], [denominator])).to.be.revertedWith('FixedPoint::divuq: overflow')
    })

    it('gas cost of full precision small dividend short circuit', async () => {
      expect(await fixedPoint.getGasCostOfDivuq([BigNumber.from(125).mul(Q112)], [BigNumber.from(30).mul(Q112)])).to.eq(
        838
      )
      expect(await fixedPoint.getGasCostOfDivuq([BigNumber.from(28).mul(Q112)], [BigNumber.from(280).mul(Q112)])).to.eq(
        838
      )
      expect(await fixedPoint.getGasCostOfDivuq([BigNumber.from(1).mul(Q112)], [BigNumber.from(3).mul(Q112)])).to.eq(
        838
      )
    })

    it('gas cost of long division with less than 112 iterations', async () => {
      // long division but makes fewer iterations
      expect(
        await fixedPoint.getGasCostOfDivuq([BigNumber.from(10).pow(10).mul(Q112)], [BigNumber.from(25).mul(Q112)])
      ).to.eq(1502)
    })

    it('gas cost of long division with all iterations', async () => {
      // 1/3rd, should make all iterations
      expect(
        await fixedPoint.getGasCostOfDivuq(
          [BigNumber.from(10).pow(10).mul(Q112)],
          [BigNumber.from(3).mul(BigNumber.from(10).pow(10)).mul(Q112)]
        )
      ).to.eq(1502)
    })
  })

  describe('#fraction', () => {
    it('correct computation less than 1', async () => {
      expect((await fixedPoint.fraction(4, 100))[0]).to.eq(BigNumber.from(4).mul(Q112).div(100))
    })

    it('correct computation greater than 1', async () => {
      expect((await fixedPoint.fraction(100, 4))[0]).to.eq(BigNumber.from(100).mul(Q112).div(4))
    })

    it('fails with 0 denominator', async () => {
      await expect(fixedPoint.fraction(BigNumber.from(1), BigNumber.from(0))).to.be.revertedWith(
        'FixedPoint::fraction: division by zero'
      )
    })
    it('can be called with numerator exceeding uint112 max', async () => {
      expect((await fixedPoint.fraction(Q112.mul(2359), 6950))[0]).to.eq(Q112.mul(Q112).mul(2359).div(6950))
    })
    it('can be called with denominator exceeding uint112 max', async () => {
      expect((await fixedPoint.fraction(2359, Q112.mul(2359)))[0]).to.eq(1)
    })
    it('can be called with numerator exceeding uint144 max', async () => {
      expect((await fixedPoint.fraction(Q112.mul(2359).mul(BigNumber.from(2).pow(32)), Q112.mul(50)))[0]).to.eq(
        BigNumber.from(2359).mul(Q112).mul(BigNumber.from(2).pow(32)).div(50)
      )
    })
    it('can be called with numerator and denominator exceeding uint112 max', async () => {
      expect((await fixedPoint.fraction(Q112.mul(2359), Q112.mul(50)))[0]).to.eq(BigNumber.from(2359).mul(Q112).div(50))
    })
    it('short circuits for 0', async () => {
      expect((await fixedPoint.fraction(0, Q112.mul(Q112).mul(2360)))[0]).to.eq(0)
    })
    it('can overflow if result of division does not fit', async () => {
      await expect(fixedPoint.fraction(Q112.mul(2359), 50)).to.be.revertedWith('FixedPoint::fraction: overflow')
    })
    it('gas cost of 0', async () => {
      expect(await fixedPoint.getGasCostOfFraction(BigNumber.from(0), BigNumber.from(569))).to.eq(210)
    })
    it('gas cost of smaller numbers', async () => {
      expect(await fixedPoint.getGasCostOfFraction(BigNumber.from(239), BigNumber.from(569))).to.eq(314)
    })
    it('gas cost of number greater than Q112 numbers', async () => {
      expect(await fixedPoint.getGasCostOfFraction(Q112.mul(2359), Q112.mul(2360))).to.eq(314)
    })
    it('gas cost of number greater than Q112 numbers', async () => {
      expect(
        await fixedPoint.getGasCostOfFraction(Q112.mul(BigNumber.from(2).pow(32).mul(2359)), Q112.mul(2360))
      ).to.eq(996)
    })
  })

  describe('#reciprocal', () => {
    it('fails for 0', async () => {
      await expect(fixedPoint.reciprocal([BigNumber.from(0)])).to.be.revertedWith(
        'FixedPoint::reciprocal: reciprocal of zero'
      )
    })
    it('fails for 1', async () => {
      await expect(fixedPoint.reciprocal([BigNumber.from(1)])).to.be.revertedWith('FixedPoint::reciprocal: overflow')
    })
    it('works for 0.25', async () => {
      expect((await fixedPoint.reciprocal([Q112.mul(BigNumber.from(25)).div(100)]))[0]).to.eq(Q112.mul(4))
    })
    it('works for 5', async () => {
      expect((await fixedPoint.reciprocal([Q112.mul(BigNumber.from(5))]))[0]).to.eq(Q112.mul(BigNumber.from(1)).div(5))
    })
  })

  describe('#sqrt', () => {
    it('works with 0', async () => {
      expect((await fixedPoint.sqrt([BigNumber.from(0)]))[0]).to.eq(BigNumber.from(0))
    })

    it('works with numbers less than 1', async () => {
      expect((await fixedPoint.sqrt([BigNumber.from(1225).mul(Q112).div(100)]))[0]).to.eq(
        BigNumber.from(35).mul(Q112).div(10)
      )
    })

    it('gas cost of less than 1', async () => {
      const input = BigNumber.from(1225).mul(Q112).div(100)
      expect(await fixedPoint.getGasCostOfSqrt([input])).to.eq(1173)
    })

    it('works for 25', async () => {
      expect((await fixedPoint.sqrt([BigNumber.from(25).mul(Q112)]))[0]).to.eq(BigNumber.from(5).mul(Q112))
    })

    it('gas cost of 25', async () => {
      const input = BigNumber.from(25).mul(Q112)
      expect(await fixedPoint.getGasCostOfSqrt([input])).to.eq(1191)
    })

    it('works for max uint144', async () => {
      const input = BigNumber.from(2).pow(144).sub(1)
      const result = (await fixedPoint.sqrt([input]))[0]
      const expected = BigNumber.from('340282366920938463463374607431768211455')
      expect(result).to.eq(expected)
    })

    it('gas cost of max uint144', async () => {
      const input = BigNumber.from(2).pow(144).sub(1)
      expect(await fixedPoint.getGasCostOfSqrt([input])).to.eq(1235)
    })

    it('works for 2**144', async () => {
      const input = BigNumber.from(2).pow(144)
      const result = (await fixedPoint.sqrt([input]))[0]
      const expected = BigNumber.from('340282366920938463463374607431768211456')
      expect(result).to.eq(expected.shr(2).shl(2))
    })

    it('gas cost of 2**144', async () => {
      const input = BigNumber.from(2).pow(144)
      expect(await fixedPoint.getGasCostOfSqrt([input])).to.eq(1640)
    })

    it('works for encoded max uint112', async () => {
      const input = BigNumber.from(2).pow(112).sub(1).mul(Q112)
      const result = (await fixedPoint.sqrt([input]))[0]
      const expected = BigNumber.from('374144419156711147060143317175368417003121712037887')
      expect(result).to.eq(expected.shr(40).shl(40))
    })

    it('gas cost of encoded max uint112', async () => {
      const input = BigNumber.from(2).pow(112).sub(1).mul(Q112)
      expect(await fixedPoint.getGasCostOfSqrt([input])).to.eq(1723)
    })

    it('works for max uint224', async () => {
      const input = BigNumber.from(2).pow(224).sub(1)
      const result = (await fixedPoint.sqrt([input]))[0]
      const expected = BigNumber.from('374144419156711147060143317175368453031918731001855')
      expect(result).to.eq(expected.shr(40).shl(40))
    })

    it('gas cost of max uint224', async () => {
      const input = BigNumber.from(2).pow(224).sub(1)
      expect(await fixedPoint.getGasCostOfSqrt([input])).to.eq(1723)
    })
  })
})
