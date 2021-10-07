const { use, expect } = require('chai')
const { ethers, waffle } = require('hardhat')
const { solidity } = waffle

use(solidity)

const { encodeParameters } = require('./utils/Ethereum')
const { expandTo18Decimals } = require('./utils/utilities')

async function enfranchise(ufarm, actor, amount) {
  await ufarm.transfer(actor.address, expandTo18Decimals(amount))
  await ufarm.connect(actor).delegate(actor.address)
}

describe('governorBravo', () => {
  let ufarm, gov, root, a1, accounts, timelock, signWallet, acct
  let targets, values, signatures, callDatas, proposalId

  const delay = 259200 //3 days
  const ABI = ['function setPendingAdmin(address pendingAdmin_)']

  beforeEach(async () => {
    ;[root, a1, acct, ...accounts] = await ethers.getSigners()
    signWallet = ethers.Wallet.createRandom()

    const UnifarmToken = await ethers.getContractFactory('UnifarmToken')
    const GovernorBravoDelegate = await ethers.getContractFactory('GovernorBravoDelegate')
    const Timelock = await ethers.getContractFactory('Timelock')

    ufarm = await UnifarmToken.deploy()
    gov = await GovernorBravoDelegate.deploy()
    timelock = await Timelock.deploy(root.address, delay)

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

    targets = [a1.address]
    values = ['0']
    signatures = ['getBalanceOf(address)']
    callDatas = [encodeParameters(['address'], [a1.address])]

    await ufarm.delegate(a1.address)
    await gov.connect(a1).propose(targets, values, signatures, callDatas, 'do nothing')
    proposalId = await gov.latestProposalIds(a1.address)
    proposalBlock = +(await ethers.provider.getBlockNumber())

    trivialProposal = await gov.proposals(proposalId)
  })

  describe('We must revert if:', () => {
    it("There does not exist a proposal with matching proposal id where the current block number is between the proposal's start block (exclusive) and end block (inclusive)", async () => {
      await expect(gov.connect(a1).castVote(proposalId, 1)).to.be.revertedWith(
        'GovernorBravo::castVoteInternal: voting is closed'
      )
    })

    it('Such proposal already has an entry in its voters set matching the sender', async () => {
      await ethers.provider.send('evm_mine')
      await ethers.provider.send('evm_mine')

      await gov.connect(accounts[4]).castVote(proposalId, 1)
      await gov.connect(accounts[3]).castVoteWithReason(proposalId, 1, '')

      await expect(gov.connect(accounts[4]).castVote(proposalId, 1)).to.be.revertedWith(
        'GovernorBravo::castVoteInternal: voter already voted'
      )
    })
  })

  describe('Otherwise', () => {
    it("we add the sender to the proposal's voters set", async () => {
      await ethers.provider.send('evm_mine')
      await ethers.provider.send('evm_mine')

      let receipt = await gov.getReceipt(proposalId, accounts[2].address)
      expect(receipt.hasVoted).to.be.false
      await gov.connect(accounts[2]).castVote(proposalId, 1)
      expect((await gov.getReceipt(proposalId, accounts[2].address)).hasVoted).to.be.true
    })

    describe("and we take the balance returned by GetPriorVotes for the given sender and the proposal's start block, which may be zero,", () => {
      let actor // an account that will propose, receive tokens, delegate to self, and vote on own proposal

      it('and we add that ForVotes', async () => {
        actor = accounts[1]
        await enfranchise(ufarm, actor, 400001)

        await gov.connect(actor).propose(targets, values, signatures, callDatas, 'do nothing')
        proposalId = await gov.latestProposalIds(actor.address)

        let beforeFors = (await gov.proposals(proposalId)).forVotes
        await ethers.provider.send('evm_mine')
        await gov.connect(actor).castVote(proposalId, 1)

        let afterFors = (await gov.proposals(proposalId)).forVotes
        expect(ethers.BigNumber.from(afterFors)).to.equal(
          ethers.BigNumber.from(beforeFors).add(expandTo18Decimals(400001))
        )
      })

      it("or AgainstVotes corresponding to the caller's support flag.", async () => {
        actor = accounts[3]
        await enfranchise(ufarm, actor, 400001)

        await gov.connect(actor).propose(targets, values, signatures, callDatas, 'do nothing')
        proposalId = await gov.latestProposalIds(actor.address)

        let beforeAgainsts = (await gov.proposals(proposalId)).againstVotes
        await ethers.provider.send('evm_mine')
        await gov.connect(actor).castVote(proposalId, 0)

        let afterAgainsts = (await gov.proposals(proposalId)).againstVotes
        expect(ethers.BigNumber.from(afterAgainsts)).to.equal(
          ethers.BigNumber.from(beforeAgainsts).add(expandTo18Decimals(400001))
        )
      })
    })

    describe('castVoteBySig', () => {
      const Domain = gov => ({
        name: 'Compound Governor Bravo',
        chainId: 1, // await web3.eth.net.getId(); See: https://github.com/trufflesuite/ganache-core/issues/515
        verifyingContract: gov._address
      })
      const Types = {
        Ballot: [
          { name: 'proposalId', type: 'uint256' },
          { name: 'support', type: 'uint8' }
        ]
      }

      it('reverts if the signatory is invalid', async () => {
        await expect(
          gov.castVoteBySig(
            proposalId,
            0,
            0,
            '0x54d5f4a33e7365f9d36694fbf3d2d525',
            '0x54d5f4a33e7365f9d36694fbf3d2d525'
          )
        ).to.be.reverted
      })
    })

    it('receipt uses two loads', async () => {
      let actor = accounts[2]
      let actor2 = accounts[3]
      let votes = 400001
      await enfranchise(ufarm, actor, votes)
      await enfranchise(ufarm, actor2, votes)

      await gov.connect(actor).propose(targets, values, signatures, callDatas, 'do nothing')
      proposalId = await gov.latestProposalIds(actor.address)

      await ethers.provider.send('evm_mine')
      await ethers.provider.send('evm_mine')
      await gov.connect(actor).castVote(proposalId, 1)
      await gov.connect(actor2).castVote(proposalId, 0)

      const receipt1 = await gov.getReceipt(proposalId, actor.address)
      const receipt2 = await gov.getReceipt(proposalId, actor2.address)

      expect(receipt1.votes).to.be.equal(expandTo18Decimals(votes))
      expect(receipt1.hasVoted).to.be.true
      expect(receipt1.support).to.be.equal(1)

      expect(receipt2.votes).to.be.equal(expandTo18Decimals(votes))
      expect(receipt2.hasVoted).to.be.true
      expect(receipt2.support).to.be.equal(0)
    })
  })

  describe('simple initialization', () => {
    it('ID is set to a globally unique identifier', async () => {
      expect(trivialProposal.id).to.equal(proposalId)
    })

    it('Proposer is set to the sender', async () => {
      expect(trivialProposal.proposer).to.equal(a1.address)
    })

    it('Start block is set to the current block number plus vote delay', async () => {
      expect(trivialProposal.startBlock).to.equal(proposalBlock + 1 + '')
    })

    it('End block is set to the current block number plus the sum of vote delay and vote period', async () => {
      expect(trivialProposal.endBlock).to.equal(proposalBlock + 1 + 17280 + '')
    })

    it('ForVotes and AgainstVotes are initialized to zero', async () => {
      expect(trivialProposal.forVotes).to.equal('0')
      expect(trivialProposal.againstVotes).to.equal('0')
    })

    it('Executed and Canceled flags are initialized to false', async () => {
      expect(trivialProposal.canceled).to.equal(false)
      expect(trivialProposal.executed).to.equal(false)
    })

    it('ETA is initialized to zero', async () => {
      expect(trivialProposal.eta).to.equal('0')
    })

    it('Targets, Values, Signatures, Calldatas are set according to parameters', async () => {
      let dynamicFields = await gov.getActions(trivialProposal.id)
      expect(dynamicFields.targets).to.deep.equal(targets)
      expect(dynamicFields.signatures).to.deep.equal(signatures)
      expect(dynamicFields.calldatas).to.deep.equal(callDatas)
    })

    describe('This function must revert if', () => {
      it('the length of the values, signatures or calldatas arrays are not the same length,', async () => {
        await expect(
          gov.connect(a1).propose(targets.concat(root.address), values, signatures, callDatas, 'do nothing')
        ).to.be.revertedWith('GovernorBravo::propose: proposal function information arity mismatch')
        await expect(
          gov.connect(a1).propose(targets, values.concat(values), signatures, callDatas, 'do nothing')
        ).to.be.revertedWith('GovernorBravo::propose: proposal function information arity mismatch')
        await expect(
          gov.connect(a1).propose(targets, values, signatures.concat(signatures), callDatas, 'do nothing')
        ).to.be.revertedWith('GovernorBravo::propose: proposal function information arity mismatch')
        await expect(
          gov.connect(a1).propose(targets, values, signatures, callDatas.concat(callDatas), 'do nothing')
        ).to.be.revertedWith('GovernorBravo::propose: proposal function information arity mismatch')
      })
      it('or if that length is zero or greater than Max Operations.', async () => {
        await expect(gov.connect(a1).propose([], [], [], [], 'do nothing')).to.be.revertedWith(
          'GovernorBravo::propose: must provide actions'
        )
      })
      describe('Additionally, if there exists a pending or active proposal from the same proposer, we must revert.', () => {
        it('reverts with pending', async () => {
          await expect(
            gov.connect(a1).propose(targets, values, signatures, callDatas, 'do nothing')
          ).to.be.revertedWith(
            'GovernorBravo::propose: one live proposal per proposer, found an already pending proposal'
          )
        })
        it('reverts with active', async () => {
          await ethers.provider.send('evm_mine')
          await ethers.provider.send('evm_mine')
          await expect(
            gov.connect(a1).propose(targets, values, signatures, callDatas, 'do nothing')
          ).to.be.revertedWith(
            'GovernorBravo::propose: one live proposal per proposer, found an already active proposal'
          )
        })
      })
    })

    it('emits log with id and description', async () => {
      await ufarm.transfer(accounts[3].address, expandTo18Decimals(400001))
      await ufarm.connect(accounts[3]).delegate(accounts[3].address)

      await ethers.provider.send('evm_mine')

      let proposalBlock = 2 + (await ethers.provider.getBlockNumber())
      await expect(gov.connect(accounts[3]).propose(targets, values, signatures, callDatas, 'second proposal'))
        .to.emit(gov, 'ProposalCreated')
        .withArgs(
          3,
          accounts[3].address,
          targets,
          values,
          signatures,
          callDatas,
          proposalBlock,
          17280 + proposalBlock,
          'second proposal'
        )
    })
  })
})
