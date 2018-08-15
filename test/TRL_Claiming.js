const config = require('../config')
var advanceToBlock = require('./helpers/advanceToBlock')
const { assertRevert } = require('./helpers/assertRevert')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const TRLContract = artifacts.require('TRL')
const PeriodicStageContract = artifacts.require('PeriodicStages')
const PeriodContract = artifacts.require('Period')
const OwnedRegistryContract = artifacts.require('OwnedRegistryMock')

contract('TRL<Claiming>', function (accounts) {
  let TRLInstance
  let FrontierTokenInstance
  let CandidateRegistryInstance
  let PeriodicStagesInstance
  let PeriodInstance
  let VoterRegistryInstance
  let startTime
  let adminAccount = web3.eth.accounts[0]
  let voterAccounts = web3.eth.accounts.slice(1, 4)
  let candidateAccounts = web3.eth.accounts.slice(5, 8)

  before('Deploying required contracts', async () => {
    FrontierTokenInstance = await Standard20TokenMock.new(voterAccounts, config.totalTokens, {from: adminAccount})
    CandidateRegistryInstance = await OwnedRegistryContract.new(candidateAccounts, {from: adminAccount})
    VoterRegistryInstance = await OwnedRegistryContract.new(voterAccounts, {from: adminAccount})
  })
  beforeEach(async () => {
    TRLInstance = await TRLContract.new(config.ttl, config.activeTime, config.claimTime, {from: adminAccount})
    TRLInstance.setToken(FrontierTokenInstance.address);
    TRLInstance.setCandidateRegistry(CandidateRegistryInstance.address);
    TRLInstance.setVoterRegistry(VoterRegistryInstance.address)
    PeriodicStagesInstance = await PeriodicStageContract.at(periodicStagesAddress)
    let periodicStagesAddress = await TRL.periodicStages.call()
    let periodAddress = await PeriodicStagesInstance.period.call()
    PeriodInstance = await PeriodContract.at(periodAddress)
    const indexInsideStage = await PeriodInstance.getRelativeIndex()
    const neededIndexInStage = config.activeTime + 1
    const blocksToAdvance = config.ttl - indexInsideStage + neededIndexInStage
    await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAdvance)
  })
  describe('Calling active functions', async () => {
    it('Should revert when someone tries to staked tokens', async () => {
      const listAddress = await TRLInstance.address
      const stakedTokens = 10
      await FrontierTokenInstance.approve(listAddress, stakedTokens, {from: voterAccounts[0]})
      const totalPreStaked = await FrontierTokenInstance.allowance.call(voterAccounts[0], listAddress)
      const currentPeriod = await TRLInstance.currentPeriod.call()
      await assertRevert(TRLInstance.buyTokenVotes(totalPreStaked, {from: voterAccounts[0]}))
    })
  })
  describe('Calculating reward', async () => {
    it('Calculate rewards as expected with integer divisions', async () => {
      const totalPool = 100
      const claimerVotes = 10
      const totalVotes = 50
      const stakedTokens = 10
      const estimatedReward = totalPool * claimerVotes / totalVotes
      const actualReward = await TRLInstance.calculateReward.call(totalPool, claimerVotes, totalVotes)
      assert.strictEqual(estimatedReward, actualReward.toNumber())
    })
    it('Calculate rewards as expected with not integer divisions', async () => {
      const totalPool = 99
      const claimerVotes = 8
      const totalVotes = 50
      const stakedTokens = 10
      const estimatedReward = Math.floor(totalPool * claimerVotes / totalVotes)
      const actualReward = await TRLInstance.calculateReward.call(totalPool, claimerVotes, totalVotes)
      assert.strictEqual(estimatedReward, actualReward.toNumber())
    })
  })
})
