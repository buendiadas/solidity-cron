const config = require('../config')
const advanceToBlock = require('../test/helpers/advanceToBlock')
const { assertRevert } = require('../test/helpers/assertRevert')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const TRLContract = artifacts.require('TRL')
const Proxy = artifacts.require('Proxy')
const PeriodicStageContract = artifacts.require('PeriodicStages')
const PeriodContract = artifacts.require('Period')
const OwnedRegistryContract = artifacts.require('OwnedRegistry')
const OwnedRegistryFactory = artifacts.require('OwnedRegistryFactory')
const keccak256 = require('js-sha3').keccak256

let OwnedRegistryFactoryInstance
let FrontierTokenInstance
let TRLInstance
let ProxyInstance
let periodicStagesAddress
let PeriodInstance
let PeriodicStagesInstance
let periodAddress

let adminAccount = web3.eth.accounts[0]
let voterAccounts = web3.eth.accounts.slice(1, 4)
let candidateAccounts = web3.eth.accounts.slice(5, 8)

contract('TRL<Migrations>', function (accounts) {
  before('Deploying required contracts', async () => {
    // set up
    OwnedRegistryFactoryInstance = await OwnedRegistryFactory.deployed()
    FrontierTokenInstance = await Standard20TokenMock.deployed()
    ProxyInstance = await Proxy.deployed()
    TRLInstance = await TRLContract.at(ProxyInstance.address)
    let candidateRegistryAddress = await TRLInstance.candidateRegistry.call();
    let voterRegistryAddress = await TRLInstance.voterRegistry.call();
    let CandidateRegistryInstance = await OwnedRegistryContract.at(candidateRegistryAddress)
    let VoterRegistryInstance = await OwnedRegistryContract.at(voterRegistryAddress)

    // whitelisting candidates
    for (let i = 0; i < candidateAccounts.length; i++) {
      await CandidateRegistryInstance.whiteList(candidateAccounts[i], {from: adminAccount})
    }
    // whitelisting voters
    for (let i = 0; i < voterAccounts.length; i++) {
      await VoterRegistryInstance.whiteList(voterAccounts[i], {from: adminAccount})
    }
    periodicStagesAddress = await TRLInstance.periodicStages.call()
    PeriodicStagesInstance = await PeriodicStageContract.at(periodicStagesAddress)
    periodAddress = await PeriodicStagesInstance.period.call()
    PeriodInstance = await PeriodContract.at(periodAddress)
  })

  // choose which tests to run
  const runTests = {
    creatingTheContract: true,
    movingPeriods: true,
    staking: true,
    voting: true,
    claiming: true
  }

  if (runTests.creatingTheContract) {
    describe('Creating the contract', async () => {
      it('Should have set the correct token as the token voting address', async () => {
        const contractTokenAddress = await TRLInstance.token.call()
        const testingTokenAddress = await FrontierTokenInstance.address
        assert.strictEqual(testingTokenAddress, contractTokenAddress)
      })
      it('Should have set the correct candidateRegistry address', async () => {
        const tokenCandidateRegistryAddress = await TRLInstance.candidateRegistry.call()
        const CandidateRegistryInstance = OwnedRegistryContract.at(tokenCandidateRegistryAddress)
        const candidateRegistryAddress = await CandidateRegistryInstance.address
        assert.strictEqual(candidateRegistryAddress, tokenCandidateRegistryAddress)
      })
      it('Should have set the correct VoterRegistryInstance address', async () => {
        const tokenVoterRegistryAddress = await TRLInstance.voterRegistry.call()
        const VoterRegistryInstance = OwnedRegistryContract.at(tokenVoterRegistryAddress)
        const voterRegistryAddress = await VoterRegistryInstance.address
        assert.strictEqual(voterRegistryAddress, tokenVoterRegistryAddress)
      })
      it('Periodic contract should have been properly set', async () => {
        const T = await PeriodInstance.T.call()
        assert.equal(config.ttl, T)
      })

      // Changed. Adapted to calculate the proper block instead of it being zero.
      it('Current Period number should be correct', async () => {
        const currentPeriod = await TRLInstance.currentPeriod.call()
        const currentBlock = web3.eth.getBlock('latest').number
        const initOffset = await PeriodInstance.initOffset.call()
        const expectedCurrentPeriod = Math.floor((currentBlock - initOffset) / config.ttl)
        assert.equal(expectedCurrentPeriod, currentPeriod)
      })
      it('Balance of Voter should be set to totalTokens', async () => {
        const balance = await FrontierTokenInstance.balanceOf.call(voterAccounts[0])
        assert.equal(config.initialBalance, balance.toNumber())
      })
    })
  }

  if (runTests.movingPeriods) {
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
        let currBlockNumber = web3.eth.blockNumber
        await advanceToBlock.advanceToBlock(currBlockNumber + periodsToAdvance * config.ttl)
        const currentPeriod = await TRLInstance.currentPeriod.call()
        assert.strictEqual(initialPeriod.toNumber() + periodsToAdvance, currentPeriod.toNumber())
      })

      it('Should increase the stage after moving to the stage position inside the period', async () => {
        const T = config.ttl
        const indexInsideStage = await PeriodInstance.getRelativeIndex()
        const neededIndexInStage = config.activeTime + 1
        const blocksToAdvance = T - indexInsideStage.toNumber() + neededIndexInStage 
        let currBlockNumber = web3.eth.blockNumber
        await advanceToBlock.advanceToBlock(currBlockNumber + blocksToAdvance)
        const newIndexInsideStage = await PeriodInstance.getRelativeIndex()
        const currentStage = await PeriodicStagesInstance.currentStage.call()
        assert.strictEqual(1, currentStage.toNumber())
      })
    })
  }
  if (runTests.staking) {
    describe('Staking', async () => {
      it('Should enable to stake Tokens', async () => {
        const listAddress = await TRLInstance.address
        const stakedTokens = 10
        await FrontierTokenInstance.approve(listAddress, stakedTokens, {from: voterAccounts[0]})
        const totalPreStaked = await FrontierTokenInstance.allowance.call(voterAccounts[0], listAddress)
        assert.equal(stakedTokens, totalPreStaked.toNumber())
      })
      it('Should edit the minimum stake amount', async () => {
        TRLInstance = await TRLContract.at(ProxyInstance.address)
        const definedMinimumStake = 10
        await TRLInstance.setMinimumStake(definedMinimumStake)
        const storedMinimumStake = await TRLInstance.stakingConstraints.call(0)
        assert.equal(definedMinimumStake, storedMinimumStake.toNumber())
      })
      it('Should edit the maximum stake amount', async () => {
        const definedMaximumStake = 10
        await TRLInstance.setMaximumStake(definedMaximumStake)
        const storedMaximumStake = await TRLInstance.stakingConstraints.call(1)
        assert.equal(definedMaximumStake, storedMaximumStake.toNumber())
      })
      it('Should throw if someone tries to stake less than the minimum amount', async () => {
        const definedMinimumStake = 10
        await TRLInstance.setMinimumStake(definedMinimumStake)
        await FrontierTokenInstance.approve(TRLInstance.address, definedMinimumStake - 1, {from: voterAccounts[0]})
        await assertRevert(TRLInstance.buyTokenVotes(definedMinimumStake - 1, {from: voterAccounts[0]}))
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
  }
  if (runTests.voting) {
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
        const requiredVotingLimitAmount = 10
        await TRLInstance.setMaxVotingLimit(requiredVotingLimitAmount, {from: adminAccount})
        const savedVotingLimitAmount = await TRLInstance.votingConstraints.call(1)
        assert.equal(requiredVotingLimitAmount, savedVotingLimitAmount.toNumber())
      })
      it('Should edit the minimum number of votes when admin requires for it', async () => {
        const requiredVotingLimitAmount = 10
        await TRLInstance.setMinVotingLimit(requiredVotingLimitAmount, {from: adminAccount})
        const savedVotingLimitAmount = await TRLInstance.votingConstraints.call(0)
        assert.equal(requiredVotingLimitAmount, savedVotingLimitAmount.toNumber())
      })
    })
  }
})
