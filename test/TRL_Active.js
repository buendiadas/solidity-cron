const config = require('../config')
const advanceToBlock = require('./helpers/advanceToBlock')
const { assertRevert } = require('./helpers/assertRevert')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const TRLContract = artifacts.require('TRL')
const PeriodicStageContract = artifacts.require('PeriodicStages')
const PeriodContract = artifacts.require('Period')
const OwnedRegistryContract = artifacts.require('OwnedRegistryMock')
const Proxy = artifacts.require('TRLProxy');

contract('TRL<Active>', function (accounts) {
  let ProxyInstance;
  let TRLInstance
  let FrontierTokenInstance
  let CandidateRegistryInstance
  let VoterRegistryInstance
  let PeriodicStagesInstance
  let PeriodInstance
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
    let periodicStagesAddress = await TRLInstance.periodicStages.call()
    PeriodicStagesInstance = await PeriodicStageContract.at(periodicStagesAddress)
    let periodAddress = await PeriodicStagesInstance.period.call()
    PeriodInstance = await PeriodContract.at(periodAddress)
  })
  describe('Creating the contract', async () => {
    it('Should have set the correct token as the token voting address', async () => {
      const contractTokenAddress = await TRLInstance.token.call()
      const testingTokenAddress = await FrontierTokenInstance.address
      assert.strictEqual(testingTokenAddress, contractTokenAddress)
    })
    it('Should have set the correct candidateRegistry address', async () => {
      const tokenCandidateRegistryAddress = await TRLInstance.candidateRegistry.call()
      const candidateRegistryAddress = await CandidateRegistryInstance.address
      assert.strictEqual(candidateRegistryAddress, tokenCandidateRegistryAddress)
    })
    it('Should have set the correct VoterRegistryInstance address', async () => {
      const tokenVoterRegistryAddress = await TRLInstance.voterRegistry.call()
      const voterRegistryAddress = await VoterRegistryInstance.address
      assert.strictEqual(voterRegistryAddress, tokenVoterRegistryAddress)
    })
    it('Periodic contract should have been properly set', async () => {
      const T = await PeriodInstance.T.call()
      assert.equal(config.ttl, T)
    })
    it('Period number should have been set to 0', async () => {
      const currentPeriod = await TRLInstance.currentPeriod.call()
      assert.equal(0, currentPeriod.toNumber())
    })
    it('Balance of Voter should be set to totalTokens', async () => {
      const balance = await FrontierTokenInstance.balanceOf.call(voterAccounts[0])
      assert.equal(config.totalTokens, balance.toNumber())
    })
  })
  describe('Moving periods', async () => {
    it('Should increase the period after advancing one period in blocks', async () => {
      const initialPeriod = await TRLInstance.currentPeriod.call()
      const periodsToAdvance = 1
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + 1 * config.ttl)
      const currentPeriod = await TRLInstance.currentPeriod.call()
      assert.strictEqual(initialPeriod.toNumber() + periodsToAdvance, currentPeriod.toNumber())
    })
    it('Should increase the period N times after advancing N periods in blocks', async () => {
      const initialPeriod = await TRLInstance.currentPeriod.call()
      const periodsToAdvance = 5
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + periodsToAdvance * config.ttl)
      const currentPeriod = await TRLInstance.currentPeriod.call()
      assert.strictEqual(initialPeriod.toNumber() + periodsToAdvance, currentPeriod.toNumber())
    })
    it('Should increase the stage after moving to the stage position inside the period', async () => {
      const T = config.ttl
      const indexInsideStage = await PeriodInstance.getRelativeIndex()
      const neededIndexInStage = config.activeTime + 1
      const blocksToAdvance = T - indexInsideStage + neededIndexInStage
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAdvance)
      const newIndexInsideStage = await PeriodInstance.getRelativeIndex()
      const currentStage = await PeriodicStagesInstance.currentStage.call()
      assert.strictEqual(1, currentStage.toNumber())
    })
  })
  describe('Staking', async () => {
    it('Should enable to stake Tokens', async () => {
      const listAddress = await TRLInstance.address
      const stakedTokens = 10
      await FrontierTokenInstance.approve(listAddress, stakedTokens, {from: voterAccounts[0]})
      const totalPreStaked = await FrontierTokenInstance.allowance.call(voterAccounts[0], listAddress)
      assert.equal(stakedTokens, totalPreStaked.toNumber())
    })
    it('Should edit the minimum stake amount', async () => {
      const definedMinimumStake = 10;
      await TRLInstance.setMinimumStake(definedMinimumStake)
      const storedMinimumStake = await TRLInstance.stakingConstraints.call(0)
      assert.equal(definedMinimumStake, storedMinimumStake.toNumber())
    })
    it('Should edit the maximum stake amount', async () => {
      const definedMaximumStake = 10;
      await TRLInstance.setMaximumStake(definedMaximumStake)
      const storedMaximumStake = await TRLInstance.stakingConstraints.call(1)
      assert.equal(definedMaximumStake, storedMaximumStake.toNumber())
    })
    it('Should throw if someone tries to stake less than the minimum amount', async () => {
      const definedMinimumStake = 10;
      await TRLInstance.setMinimumStake(definedMinimumStake)
      await FrontierTokenInstance.approve(TRLInstance.address, definedMinimumStake -1 , {from: voterAccounts[0]})
      await assertRevert(TRLInstance.buyTokenVotes(definedMinimumStake -1, {from: voterAccounts[0]}))
    })
    it('Should record the number of votes bought in period 0 on the first period', async () => {
      const listAddress = await TRLInstance.address
      const stakedTokens = 10
      await FrontierTokenInstance.approve(listAddress, stakedTokens, {from: voterAccounts[0]})
      const totalPreStaked = await FrontierTokenInstance.allowance.call(voterAccounts[0], listAddress)
      const currentPeriod = await TRLInstance.currentPeriod.call()
      await TRLInstance.buyTokenVotes(totalPreStaked, {from: voterAccounts[0]})
      const votingBalance = await TRLInstance.votesBalance.call(currentPeriod, voterAccounts[0])
      assert.equal(totalPreStaked, votingBalance.toNumber())
    })
    it('Should record the number of staked tokens in period N on the future periods', async () => {
      const listAddress = await TRLInstance.address
      const stakedTokens = 10
      await FrontierTokenInstance.approve(listAddress, stakedTokens, {from: voterAccounts[0]})
      const totalPreStaked = await FrontierTokenInstance.allowance.call(voterAccounts[0], listAddress)
      const periodsToAdvance = 5
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + periodsToAdvance * config.ttl)
      const currentPeriod = await TRLInstance.currentPeriod.call()
      await TRLInstance.buyTokenVotes(totalPreStaked, {from: voterAccounts[0]})
      const votingBalance = await TRLInstance.votesBalance.call(currentPeriod, voterAccounts[0])
      assert.equal(totalPreStaked, votingBalance.toNumber())
    })
  })
  describe('Voting', async () => {
    it('Should increase the number of votes received per analyst in the period after voting', async () => {
      const listAddress = await TRLInstance.address
      const totalPreStaked = await FrontierTokenInstance.allowance.call(voterAccounts[0], listAddress)
      const currentPeriod = await TRLInstance.currentPeriod.call()
      await TRLInstance.buyTokenVotes(totalPreStaked, {from: voterAccounts[0]})
      const votingBalance = await TRLInstance.votesBalance.call(currentPeriod, voterAccounts[0])
      await TRLInstance.vote(candidateAccounts[0], votingBalance, {from: voterAccounts[0]})
      const votesReceived = await TRLInstance.votesReceived.call(currentPeriod, candidateAccounts[0])
      assert.equal(votingBalance.toNumber(), votesReceived.toNumber())
    })
    it('Should edit the maximum number of votes when admin requires for it', async () => {
      const requiredVotingLimitAmount = 10;
      await TRLInstance.setMaxVotingLimit(requiredVotingLimitAmount, {from:adminAccount})
      const savedVotingLimitAmount = await TRLInstance.votingConstraints.call(1)
      assert.equal(requiredVotingLimitAmount, savedVotingLimitAmount.toNumber())
    })
    it('Should edit the minimum number of votes when admin requires for it', async () => {
      const requiredVotingLimitAmount = 10;
      await TRLInstance.setMinVotingLimit(requiredVotingLimitAmount, {from:adminAccount})
      const savedVotingLimitAmount = await TRLInstance.votingConstraints.call(0)
      assert.equal(requiredVotingLimitAmount, savedVotingLimitAmount.toNumber())
    })
    it('Should increase the number of votes received per analyst in the period after voting on a future period', async () => {
      const listAddress = await TRLInstance.address
      const stakedTokens = 10
      await FrontierTokenInstance.approve(listAddress, stakedTokens, {from: voterAccounts[0]})
      const totalPreStaked = await FrontierTokenInstance.allowance.call(voterAccounts[0], listAddress)
      assert.equal(stakedTokens, totalPreStaked.toNumber())
      const initialPeriod = await TRLInstance.currentPeriod.call()
      const periodsToAdvance = 5
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + periodsToAdvance * config.ttl)
      const currentPeriod = await TRLInstance.currentPeriod.call()
      assert.equal(currentPeriod, periodsToAdvance)
      await TRLInstance.buyTokenVotes(totalPreStaked, {from: voterAccounts[0]})
      const votingBalance = await TRLInstance.votesBalance.call(currentPeriod, voterAccounts[0])
      await TRLInstance.vote(candidateAccounts[0], votingBalance, {from: voterAccounts[0]})
      const votesReceived = await TRLInstance.votesReceived.call(currentPeriod, candidateAccounts[0])
      assert.equal(votingBalance.toNumber(), votesReceived.toNumber())
    })
    it('Should revert when someone tries to vote tokens if it is on a different stage than 0', async () => {
      const listAddress = await TRLInstance.address
      const stakedTokens = 10
      await FrontierTokenInstance.approve(listAddress, stakedTokens, {from: voterAccounts[0]})
      const totalPreStaked = await FrontierTokenInstance.allowance.call(voterAccounts[0], listAddress)
      assert.equal(stakedTokens, totalPreStaked.toNumber())
      await TRLInstance.buyTokenVotes(totalPreStaked, {from: voterAccounts[0]})
      const neededIndexInStage = config.activeTime + 1
      const T = config.ttl
      const indexInsideStage = await PeriodInstance.getRelativeIndex()
      const blocksToAdvance = T - indexInsideStage + neededIndexInStage
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + blocksToAdvance)
      await assertRevert(TRLInstance.vote(candidateAccounts[0], totalPreStaked, {from: voterAccounts[0]}))
    })
    it('Should revert when someone tries to vote tokens over the MaxVotingLimitAmount', async () => {
      const requiredVotingLimitAmount = 10;
      const votingAmount = requiredVotingLimitAmount + 1;
      await TRLInstance.setMaxVotingLimit(requiredVotingLimitAmount, {from:adminAccount})
      await FrontierTokenInstance.approve(TRLInstance.address, votingAmount, {from: voterAccounts[0]})
      await TRLInstance.buyTokenVotes(votingAmount, {from: voterAccounts[0]})
      await assertRevert(TRLInstance.vote(candidateAccounts[0], votingAmount, {from: voterAccounts[0]}))
    })
    it('Should revert when someone tries to vote tokens below the minVotingLimitAmount', async () => {
      const requiredVotingLimitAmount = 10;
      const votingAmount = requiredVotingLimitAmount - 1;
      await TRLInstance.setMinVotingLimit(requiredVotingLimitAmount, {from:adminAccount})
      await FrontierTokenInstance.approve(TRLInstance.address, votingAmount, {from: voterAccounts[0]})
      await TRLInstance.buyTokenVotes(votingAmount, {from: voterAccounts[0]})
      await assertRevert(TRLInstance.vote(candidateAccounts[0], votingAmount, {from: voterAccounts[0]}))
    })
  })
  describe('Claiming', async () => {
    it('Should Throw when someone tries to claim', async () => {
      const listAddress = await TRLInstance.address
      const totalPreStaked = await FrontierTokenInstance.allowance.call(voterAccounts[0], listAddress)
      const currentPeriod = await TRLInstance.currentPeriod.call()
      await TRLInstance.buyTokenVotes(totalPreStaked, {from: voterAccounts[0]})
      const votingBalance = await TRLInstance.votesBalance.call(currentPeriod, voterAccounts[0])
      await TRLInstance.vote(candidateAccounts[0], votingBalance, {from: voterAccounts[0]})
      await assertRevert(TRLInstance.claimBounty(), {from: voterAccounts[0]})
    })
  })
})
