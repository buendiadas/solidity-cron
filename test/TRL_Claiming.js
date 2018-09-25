const config = require('../config')
var advanceToBlock = require('./helpers/advanceToBlock')
const { assertRevert } = require('./helpers/assertRevert')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const TRLContract = artifacts.require('TRL')
const PeriodicStageContract = artifacts.require('PeriodicStages')
const PeriodContract = artifacts.require('Period')
const VaultContract = artifacts.require('Vault')
const OwnedRegistryContract = artifacts.require('OwnedRegistryMock')

contract('TRL<Claiming>', function (accounts) {
  let TRLInstance
  let FrontierTokenInstance
  let CandidateRegistryInstance
  let PeriodicStagesInstance
  let PeriodInstance
  let Vault
  let VoterRegistryInstance
  let startTime
  let adminAccount = web3.eth.accounts[0]
  let voterAccounts = web3.eth.accounts.slice(1, 4)
  let candidateAccounts = web3.eth.accounts.slice(5, 8)

  before('Deploying required contracts', async () => {
    FrontierTokenInstance = await Standard20TokenMock.new(voterAccounts, config.totalTokens, {from: adminAccount})
    CandidateRegistryInstance = await OwnedRegistryContract.new(candidateAccounts, {from: adminAccount})
    VoterRegistryInstance = await OwnedRegistryContract.new(voterAccounts, {from: adminAccount})
    Vault = await VaultContract.new({from: adminAccount})
  })
  beforeEach(async () => {
    TRLInstance = await TRLContract.new({from: adminAccount})
    await TRLInstance.setToken(FrontierTokenInstance.address)
    await TRLInstance.setCandidateRegistry(CandidateRegistryInstance.address)
    await TRLInstance.setVoterRegistry(VoterRegistryInstance.address)
    await TRLInstance.initPeriod(config.ttl)
    await TRLInstance.initStages(config.activeTime, config.claimTime)
    let periodicStagesAddress = await TRLInstance.periodicStages.call()
    PeriodicStagesInstance = await PeriodicStageContract.at(periodicStagesAddress)
    let periodAddress = await PeriodicStagesInstance.period.call()
    PeriodInstance = await PeriodContract.at(periodAddress)
    const indexInsideStage = await PeriodInstance.getRelativeIndex()
    const neededIndexInStage = config.activeTime + 1
    const blocksToAdvance = config.ttl - indexInsideStage + neededIndexInStage + 2
    await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAdvance)
  })
  describe('Calling active functions', async () => {
    it('Should revert when someone tries to stake tokens', async () => {
      const listAddress = await TRLInstance.address
      const stakedTokens = 10
      await FrontierTokenInstance.approve(listAddress, stakedTokens, {from: voterAccounts[0]})
      const totalPreStaked = await FrontierTokenInstance.allowance.call(voterAccounts[0], listAddress)
      const height = await TRLInstance.height.call()
      const currentStage = await TRLInstance.currentStage.call()
      const currentIndex = await PeriodInstance.getRelativeIndex()
      const currentStage2 = await PeriodicStagesInstance.currentStage.call()
      await assertRevert(TRLInstance.buyTokenVotes(totalPreStaked, {from: voterAccounts[0]}))
    })
  })
})
