/* global artifacts contract before web3 describe assert describe assert it  */
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
const VaultContract = artifacts.require('Vault')
const AllowanceContract = artifacts.require('Allowance')
const HelenaFeeContract = artifacts.require('helenaAgent')
const BankContract = artifacts.require('Bank')
const keccak256 = require('js-sha3').keccak256

let OwnedRegistryFactoryInstance
let FrontierTokenInstance
let TRLInstance
let ProxyInstance
let periodicStagesAddress
let PeriodInstance
let PeriodicStagesInstance
let periodAddress
let vaultInstance
let allowanceInstance
let helenaFeeInstance
let bankInstance

let adminAccount = web3.eth.accounts[0]
let voterAccounts = web3.eth.accounts.slice(1, 4)
let candidateAccounts = web3.eth.accounts.slice(5, 8)

const WINDOW_SIZE = config.reputationWindowSize
const linWeightsSmaller = config.reputationWeights

contract('TRL<Migrations>', function (accounts) {
  before('Deploying required contracts', async () => {
    // set up
    OwnedRegistryFactoryInstance = await OwnedRegistryFactory.deployed()
    FrontierTokenInstance = await Standard20TokenMock.deployed()
    ProxyInstance = await Proxy.deployed()
    TRLInstance = await TRLContract.at(ProxyInstance.address)
    let candidateRegistryAddress = await TRLInstance.candidateRegistry.call()
    let voterRegistryAddress = await TRLInstance.voterRegistry.call()
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

    vaultInstance = await VaultContract.deployed()
    allowanceInstance = await AllowanceContract.deployed()
    bankInstance = await BankContract.deployed()
    helenaFeeInstance = await HelenaFeeContract.deployed()
  })

  // choose which tests to run
  const runTests = {
    creatingTheContract: false,
    movingPeriods: true,
    staking: true,
    voting: true,
    claiming: true,
    payments: true,
    scoring: false // disabled because it conflicts with config.ttl
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
        const periodsToAdvance = 2
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
        const definedMaximumStake = 1000
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
        const stakedTokens = 20
        await FrontierTokenInstance.approve(listAddress, stakedTokens, {from: voterAccounts[0]})
        const totalPreStaked = await FrontierTokenInstance.allowance.call(voterAccounts[0], listAddress)
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
        const stakedTokens = 10
        await FrontierTokenInstance.approve(listAddress, stakedTokens, {from: voterAccounts[0]})
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

  if (runTests.payments) {
    describe('Payments', async () => {
      it('Should make the payment', async() => {
        const fundingValue = 10

        const receiver = candidateAccounts[1]
        const period = 0
        const owner = adminAccount

        await FrontierTokenInstance.approve(vaultInstance.address, fundingValue, { from: voterAccounts[0]})

        await vaultInstance.deposit(0, FrontierTokenInstance.address, voterAccounts[0], fundingValue, { from: voterAccounts[0] })
        await vaultInstance.close(0, FrontierTokenInstance.address)

        await allowanceInstance.addEntity(helenaFeeInstance.address, 'Helena-fee', 100, period)
        await helenaFeeInstance.addAllowedReceiver(receiver, FrontierTokenInstance.address, { from: owner })

        await bankInstance.setBalancesForEntities([helenaFeeInstance.address], FrontierTokenInstance.address, period)
        await vaultInstance.setBankContractAddress(bankInstance.address, { from: owner })

        await helenaFeeInstance.collectPayment(receiver, FrontierTokenInstance.address, period)
        const receiverBalance = await FrontierTokenInstance.balanceOf(receiver)
        assert.equal(receiverBalance, fundingValue)
      })
    })
  }

  if (runTests.scoring) {
    describe('Reputation', async () => {
      const absLinWeights = [0.39999999999999997, 0.3, 0.19999999999999998, 0.10000000000000002, 0.0]
      const absRatWeights = [0.4461021786749173, 0.21733183063649814, 0.14366002364107508, 0.10729039740282821, 0.0856155696446811]
      const absExpWeights = [0.6399171800385933, 0.23304644109045747, 0.08487136366873695, 0.03090863922781419, 0.011256375974398092]

      const MUL_CONSTANT = 1000000000
      const linWeights = absLinWeights.map(currWeight => parseInt(currWeight * MUL_CONSTANT))
      const ratWeights = absRatWeights.map(currWeight => parseInt(currWeight * MUL_CONSTANT))
      const expWeights = absExpWeights.map(currWeight => parseInt(currWeight * MUL_CONSTANT))

      const analyst1Scores = [628, 644, 489, 463, 409, 593, 585, 616, 412, 556]
      const analyst2Scores = [477, 481, 631, 346, 409, 527, 585, 479, 301, 496]

      const expectedAnalyst1LastPeriodScoreLin = 527.7000
      const expectedAnalyst1LastPeriodScoreRat = 539.6030
      const expectedAnalyst1LastPeriodScoreExp = 528.8464

      const expectedAnalyst2LastPeriodScoreLin = 443.000
      const expectedAnalyst2LastPeriodScoreRat = 463.3810
      const expectedAnalyst2LastPeriodScoreExp = 452.2129

      const expectedAnalyst1FirstPeriodScoreLin = 446.0000
      const expectedAnalyst1FirstPeriodScoreRat = 423.7742
      const expectedAnalyst1FirstPeriodScoreExp = 558.4598

      const expectedAnalyst2FirstPeriodScoreLin = 335.5000
      const expectedAnalyst2FirstPeriodScoreRat = 318.2424
      const expectedAnalyst2FirstPeriodScoreExp = 418.9633

      const votesRecord = [60, 59, 61, 41, 56]
      const stakedTokens = 999

      let epoch
      let TRLScoring

      it('The WeightedScore pure function should yeld the same values as the Python algorithm', async () => {
        const score = await TRLInstance.scoring(0, adminAccount)

        let actualAnalyst1LastPeriodScoreLin = await TRLInstance.weightedScore(linWeights, analyst1Scores, WINDOW_SIZE)
        actualAnalyst1LastPeriodScoreLin = Number((actualAnalyst1LastPeriodScoreLin / MUL_CONSTANT).toFixed(4))
        assert.equal(expectedAnalyst1LastPeriodScoreLin, actualAnalyst1LastPeriodScoreLin)
      })

      it('The WeightedScore pure function should yeld correct values when the window size is smaller', async () => {
        let actualAnalyst1FirstPeriodScoreLin = await TRLInstance.weightedScore(linWeights, [analyst1Scores[0], analyst1Scores[1]], WINDOW_SIZE)
        actualAnalyst1FirstPeriodScoreLin = Number((actualAnalyst1FirstPeriodScoreLin / MUL_CONSTANT).toFixed(4))
        assert.equal(expectedAnalyst1FirstPeriodScoreLin, actualAnalyst1FirstPeriodScoreLin)
      })

      it('The reputation function should calculate the correct reputation value for a user', async () => {
        const rep1ExpectedResult = 52800000000
        const listAddress = await TRLInstance.address

        await FrontierTokenInstance.approve(listAddress, 400, {from: voterAccounts[0]})

        let currentPeriod
        for (let i = 0; i < 5; i++) {
          const totalPreStaked = await FrontierTokenInstance.allowance.call(voterAccounts[0], listAddress)
          currentPeriod = await TRLInstance.currentPeriod.call()
          await TRLInstance.buyTokenVotes(70, {from: voterAccounts[0]})
          await TRLInstance.vote(candidateAccounts[0], votesRecord[i], {from: voterAccounts[0]})
          await advanceToBlock.advanceToBlock(web3.eth.blockNumber + 1 * config.ttl)
        }

        let res = await TRLInstance.reputation.call(currentPeriod, candidateAccounts[0])
        assert.equal(parseInt(rep1ExpectedResult), parseInt(res))
      })
    })
  }
})
