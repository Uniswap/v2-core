const { use, expect } = require('chai')
const { ethers, waffle } = require('hardhat')
const { solidity } = waffle

use(solidity)

const { encodeParameters, both } = require('./utils/Ethereum')
const { expandTo18Decimals } = require('./utils/utilities')

async function enfranchise(ufarm, actor, amount) {
  await ufarm.transfer(actor.address, expandTo18Decimals(amount))
  await ufarm.connect(actor).delegate(actor.address)
}
const ABI = ['function setPendingAdmin(address pendingAdmin_)']
const delay = 259200 //3 days

describe('GovernorBravo#queue/1', () => {
  let root, a1, a2, accounts
  let ufarm
  let gov
  let timelock
  beforeEach(async () => {
    ;[root, a1, a2, ...accounts] = await ethers.getSigners()

    const UnifarmToken = await ethers.getContractFactory('UnifarmToken')
    const GovernorBravoDelegate = await ethers.getContractFactory('GovernorBravoDelegate')
    const Timelock = await ethers.getContractFactory('Timelock')

    ufarm = await UnifarmToken.deploy()
    gov = await GovernorBravoDelegate.deploy()
    timelock = await Timelock.deploy(root.address, delay)
  })

  describe('overlapping actions', async () => {
    it('reverts on queueing overlapping actions in same proposal', async () => {
      //initialise
      await ufarm.__UnifarmToken_init(expandTo18Decimals('10000000000'))
      await gov
        .connect(root)
        .initialize(timelock.address, ufarm.address, 17280, 1, '100000000000000000000000', root.address)

      let iface = new ethers.utils.Interface(ABI)
      const setPendingAdminData = iface.encodeFunctionData('setPendingAdmin', [gov.address])

      const timestamp = (await ethers.provider.getBlock()).timestamp
      const eta = timestamp + delay * 2

      await timelock.connect(root).queueTransaction(timelock.address, 0, '', setPendingAdminData, eta)
      await ethers.provider.send('evm_increaseTime', [delay * 2])
      await timelock.connect(root).executeTransaction(timelock.address, 0, '', setPendingAdminData, eta)

      await gov._initiate()

      await enfranchise(ufarm, a1, 3e6)
      await ethers.provider.send('evm_mine')

      const targets = [ufarm.address, ufarm.address]
      const values = ['0', '0']
      const signatures = ['getBalanceOf(address)', 'getBalanceOf(address)']
      const calldatas = [encodeParameters(['address'], [root.address]), encodeParameters(['address'], [root.address])]

      await ufarm.delegate(a1.address)
      await gov.connect(a1).propose(targets, values, signatures, calldatas, 'do nothing')
      proposalId = await gov.latestProposalIds(a1.address)

      await ethers.provider.send('evm_mine')

      await gov.connect(a1).castVote(proposalId, 1)
      const currentBlock = (await ethers.provider.getBlock()).timestamp
      await ethers.provider.send('evm_mine', [currentBlock + 4000])

      await expect(gov.queue(proposalId)).to.be.revertedWith(
        'GovernorBravo::queue: proposal can only be queued if it is succeeded'
      )
    })
  })
})
