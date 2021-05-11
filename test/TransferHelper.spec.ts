import chai, {expect} from 'chai'
import {Contract, constants} from 'ethers'
import {solidity, MockProvider, deployContract} from 'ethereum-waffle'

import TransferHelperTest from '../build/TransferHelperTest.json'
import FakeFallback from '../build/TransferHelperTestFakeFallback.json'
import FakeERC20Noncompliant from '../build/TransferHelperTestFakeERC20Noncompliant.json'
import FakeERC20Compliant from '../build/TransferHelperTestFakeERC20Compliant.json'

chai.use(solidity)

const overrides = {
  gasLimit: 9999999,
}

describe('TransferHelper', () => {
  const provider = new MockProvider({
    ganacheOptions: {
      hardfork: 'istanbul',
      mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
      gasLimit: 9999999,
    },
  })
  const [wallet] = provider.getWallets()

  let transferHelper: Contract
  let fakeFallback: Contract
  let fakeCompliant: Contract
  let fakeNoncompliant: Contract
  before(async () => {
    transferHelper = await deployContract(wallet, TransferHelperTest, [], overrides)
    fakeFallback = await deployContract(wallet, FakeFallback, [], overrides)
    fakeNoncompliant = await deployContract(wallet, FakeERC20Noncompliant, [], overrides)
    fakeCompliant = await deployContract(wallet, FakeERC20Compliant, [], overrides)
  })

  // sets up the fixtures for each token situation that should be tested
  function harness({sendTx, expectedError}: {sendTx: (tokenAddress: string) => Promise<void>; expectedError: string}) {
    it('succeeds with compliant with no revert and true return', async () => {
      await fakeCompliant.setup(true, false)
      await sendTx(fakeCompliant.address)
    })
    it('fails with compliant with no revert and false return', async () => {
      await fakeCompliant.setup(false, false)
      await expect(sendTx(fakeCompliant.address)).to.be.revertedWith(expectedError)
    })
    it('fails with compliant with revert', async () => {
      await fakeCompliant.setup(false, true)
      await expect(sendTx(fakeCompliant.address)).to.be.revertedWith(expectedError)
    })
    it('succeeds with noncompliant (no return) with no revert', async () => {
      await fakeNoncompliant.setup(false)
      await sendTx(fakeNoncompliant.address)
    })
    it('fails with noncompliant (no return) with revert', async () => {
      await fakeNoncompliant.setup(true)
      await expect(sendTx(fakeNoncompliant.address)).to.be.revertedWith(expectedError)
    })
  }

  describe('#safeApprove', () => {
    harness({
      sendTx: (tokenAddress) => transferHelper.safeApprove(tokenAddress, constants.AddressZero, constants.MaxUint256),
      expectedError: 'TransferHelper::safeApprove: approve failed',
    })
  })
  describe('#safeTransfer', () => {
    harness({
      sendTx: (tokenAddress) => transferHelper.safeTransfer(tokenAddress, constants.AddressZero, constants.MaxUint256),
      expectedError: 'TransferHelper::safeTransfer: transfer failed',
    })
  })
  describe('#safeTransferFrom', () => {
    harness({
      sendTx: (tokenAddress) =>
        transferHelper.safeTransferFrom(
          tokenAddress,
          constants.AddressZero,
          constants.AddressZero,
          constants.MaxUint256
        ),
      expectedError: 'TransferHelper::transferFrom: transferFrom failed',
    })
  })

  describe('#safeTransferETH', () => {
    it('succeeds call not reverted', async () => {
      await fakeFallback.setup(false)
      await transferHelper.safeTransferETH(fakeFallback.address, 0)
    })
    it('fails if call reverts', async () => {
      await fakeFallback.setup(true)
      await expect(transferHelper.safeTransferETH(fakeFallback.address, 0)).to.be.revertedWith(
        'TransferHelper::safeTransferETH: ETH transfer failed'
      )
    })
  })
})
