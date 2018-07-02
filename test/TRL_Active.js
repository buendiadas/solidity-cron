const config = require('../config')
const { increaseTimeTo } = require('./helpers/increaseTime')
var advanceToBlock = require('./helpers/advanceToBlock')
const { assertRevert } = require('./helpers/assertRevert')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const TRLContract = artifacts.require('TRL')
const PeriodicStageContract = artifacts.require('PeriodicStages')
const PeriodContract = artifacts.require('Period')
const OwnedRegistryContract = artifacts.require('OwnedRegistryMock')

contract('TRL<Active>', function (accounts) {
  let TRL
  let FrontierToken
  let CandidateRegistry
  let PeriodicStagesInstance;
  let PeriodInstance;
  let VoterRegistry
  let startTime
  let adminAccount = web3.eth.accounts[0]
  let voterAccounts = web3.eth.accounts.slice(1, 4)
  let candidateAccounts = web3.eth.accounts.slice(5, 8)

  const totalTokens = 1000

  before('Deploying required contracts', async () => {
    FrontierToken = await Standard20TokenMock.new(voterAccounts, totalTokens, {from: adminAccount})
    CandidateRegistry = await OwnedRegistryContract.new(candidateAccounts, {from: adminAccount})
    VoterRegistry = await OwnedRegistryContract.new(voterAccounts, {from: adminAccount})
  })
  beforeEach(async () => {
    TRL = await TRLContract.new(FrontierToken.address, CandidateRegistry.address, VoterRegistry.address, config.ttl, config.activeTime, config.claimTime, {from: adminAccount})
    let periodicStagesAddress = await TRL.periodicStages.call();
    PeriodicStagesInstance = await PeriodicStageContract.at(periodicStagesAddress);
    let periodAddress = await PeriodicStagesInstance.period.call();
    PeriodInstance = await PeriodContract.at(periodAddress);
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
    it('Periodic contract should have been properly set', async () => {
      const T = await PeriodInstance.T.call();
      assert.equal(config.ttl,T)
    })
    it('Period number should have been set to 0', async () => {
      const currentPeriod = await TRL.currentPeriod.call()
      assert.equal(0, currentPeriod.toNumber())
    })
    it('Balance of Voter should be set to totalTokens', async () => {
      const balance = await FrontierToken.balanceOf.call(voterAccounts[0])
      assert.equal(totalTokens, balance.toNumber())
    })
  })
  describe('State: <Active>', async () => {
    it('Should throw when someone tries to claim a Bounty', async () => {
      await assertRevert(TRL.claimBounty({from: candidateAccounts[0]}))
    })
    it('Should enable to stake Tokens', async () => {
      const listAddress = await TRL.address
      const totalPreStaked = await FrontierToken.allowance.call(voterAccounts[0], listAddress)
      const currentPeriodIndex = await TRL.currentPeriod.call()
      await TRL.buyTokenVotes(totalPreStaked, {from: voterAccounts[0]})
      const votingBalance = await TRL.votesBalance.call(currentPeriodIndex, voterAccounts[0])
      assert.equal(totalPreStaked, votingBalance.toNumber())
    })
    it('Should increase the number of votes received per analyst in the period after voting', async () => {
      const listAddress = await TRL.address
      const totalPreStaked = await FrontierToken.allowance.call(voterAccounts[0], listAddress)
      const currentPeriodIndex = await TRL.currentPeriod.call()
      await TRL.buyTokenVotes(totalPreStaked, {from: voterAccounts[0]})
      const votingBalance = await TRL.votesBalance.call(currentPeriodIndex, voterAccounts[0])
      await TRL.vote(candidateAccounts[0], votingBalance, {from: voterAccounts[0]})
      const votesReceived = await TRL.votesReceived.call(currentPeriodIndex, candidateAccounts[0])
      assert.equal(votingBalance.toNumber(), votesReceived.toNumber())
    })
    it('Should increase the period after advancing one period in blocks', async () => {
      const initialPeriod = await TRL.currentPeriod.call()
      const periodsToAdvance = 1;
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + 1 * config.ttl);
      const currentPeriod = await TRL.currentPeriod.call()
      assert.strictEqual(initialPeriod.toNumber() + periodsToAdvance, currentPeriod.toNumber())
    })
    it('Should increase the period N times after advancing N periods in blocks', async () => {
      const initialPeriod = await TRL.currentPeriod.call()
      const periodsToAdvance = 5;
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + 5* config.ttl);
      const currentPeriodIndex = await TRL.currentPeriod.call()
      const currentPeriod = await TRL.currentPeriod.call()
      assert.strictEqual(initialPeriod.toNumber() + periodsToAdvance, currentPeriod.toNumber())
    })
  })
})
