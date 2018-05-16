const config = require('../..//config')
const { increaseTimeTo } = require('../helpers/increaseTime')
const { assertRevert } = require('../helpers/assertRevert')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const TRLContract = artifacts.require('TRL')
const OwnedRegistryContract = artifacts.require('OwnedRegistryMock')

contract('TRL<Active>', function (accounts) {
  let TRL
  let FrontierToken
  let CandidateRegistry
  let VoterRegistry
  let startTime
  let adminAccount = web3.eth.accounts[0]
  let voterAccounts = web3.eth.accounts.slice(1, 4)
  let candidateAccounts = web3.eth.accounts.slice(5, 8)

  const totalTokens = 1000

  before('Deploying required contracts', async () => {
    FrontierToken = await Standard20TokenMock.new(voterAccounts, totalTokens, {from: adminAccount})
    CandidateRegistry = await OwnedRegistryContract.new(candidateAccounts, 5, {from: adminAccount})
    VoterRegistry = await OwnedRegistryContract.new(voterAccounts, 5, {from: adminAccount})
  })
  beforeEach(async () => {
    TRL = await TRLContract.new(FrontierToken.address, CandidateRegistry.address, VoterRegistry.address, config.ttl, config.activeTime, config.claimTime, {from: adminAccount})
    const currentPeriodIndex = await TRL.periodIndex.call()
    const currentPeriod = await TRL.periodRegistry.call(currentPeriodIndex)
    startTime = await currentPeriod[0].toNumber()
  })
  describe('Creating the contract', async () => {
    it('Should have set the correct token as the token voting address', async () => {
      const contractTokenAddress = await TRL.token.call()
      const testingTokenAddress = await FrontierToken.address
      assert.strictEqual(testingTokenAddress, contractTokenAddress)
    })
    it('Should have set the correct candidateRegistry address', async () => {
      const tokenCandidateRegistryAddress = await TRL.candidateRegistry.call()
      const candidateRegistryAddress = await CandidateRegistry.address
      assert.strictEqual(candidateRegistryAddress, tokenCandidateRegistryAddress)
    })
    it('Should have set the correct voterRegistry address', async () => {
      const tokenVoterRegistryAddress = await TRL.voterRegistry.call()
      const voterRegistryAddress = await VoterRegistry.address
      assert.strictEqual(voterRegistryAddress, tokenVoterRegistryAddress)
    })
    it('Period should have been set to 0', async () => {
      const currentPeriod = await TRL.periodIndex.call()
      assert.equal(0, currentPeriod.toNumber())
    })
    it('Initial Period TTL should have been set to initialTTL', async () => {
      const currentPeriodIndex = await TRL.periodIndex.call()
      const currentPeriod = await TRL.periodRegistry.call(currentPeriodIndex)
      const currentTTL = await currentPeriod[3].toNumber()
      assert.strictEqual(config.ttl, currentTTL)
    })
    it('Balance of Voter should be set to totalTokens', async () => {
      const balance = await FrontierToken.balanceOf.call(voterAccounts[0])
      assert.equal(totalTokens, balance.toNumber())
    })
  })
  describe('State: <Active>', async () => {
    it('First Period should have initially an <Active> state', async () => {
      const currentPeriodIndex = await TRL.periodIndex.call()
      const currentPeriod = await TRL.periodRegistry.call(currentPeriodIndex)
      const currentState = await currentPeriod[2].toNumber()
      assert.strictEqual(1, currentState)
    })
    it('Should throw when someone tries to claim a Bounty', async () => {
      await assertRevert(TRL.claimBounty({from: candidateAccounts[0]}))
    })
    it('Should throw when someone tries to move to Claiming state before activeTime', async () => {
      await assertRevert(TRL.initClaimingState({from: candidateAccounts[0]}))
    })
    it('Should throw when someone tries to close the period', async () => {
      await assertRevert(TRL.closePeriod({from: adminAccount}))
    })
    it('Should enable to stake Tokens', async () => {
      const listAddress = await TRL.address
      const totalPreStaked = await FrontierToken.allowance.call(voterAccounts[0], listAddress)
      const currentPeriodIndex = await TRL.periodIndex.call()
      await TRL.buyTokenVotes(totalPreStaked, {from: voterAccounts[0]})
      const votingBalance = await TRL.votesBalance.call(currentPeriodIndex, voterAccounts[0])
      assert.equal(totalPreStaked, votingBalance.toNumber())
    })
    it('Should increase the number of votes received per analyst in the period after voting', async () => {
      const listAddress = await TRL.address
      const totalPreStaked = await FrontierToken.allowance.call(voterAccounts[0], listAddress)
      const currentPeriodIndex = await TRL.periodIndex.call()
      await TRL.buyTokenVotes(totalPreStaked, {from: voterAccounts[0]})
      const votingBalance = await TRL.votesBalance.call(currentPeriodIndex, voterAccounts[0])
      await TRL.vote(candidateAccounts[0], votingBalance, {from: voterAccounts[0]})
      const votesReceived = await TRL.votesReceived.call(currentPeriodIndex, candidateAccounts[0])
      assert.equal(votingBalance.toNumber(), votesReceived.toNumber())
    })
    it('Should change state to <Claiming> when someone tries to move to Claiming state after activeTime', async () => {
      await increaseTimeTo(startTime + config.activeTime + 1)
      await TRL.initClaimingState({from: candidateAccounts[0]})
      const currentPeriodIndex = await TRL.periodIndex.call()
      const currentPeriod = await TRL.periodRegistry.call(currentPeriodIndex)
      const currentState = await currentPeriod[2].toNumber()
      assert.strictEqual(2, currentState)
    })
  })
})
