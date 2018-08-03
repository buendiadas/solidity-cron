const config = require('../config')
const advanceToBlock = require('./helpers/advanceToBlock')
const { assertRevert } = require('./helpers/assertRevert')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const TRLContract = artifacts.require('TRL')
const PeriodicStageContract = artifacts.require('PeriodicStages')
const PeriodContract = artifacts.require('Period')
const OwnedRegistryContract = artifacts.require('OwnedRegistryMock')
const OwnedRegistryFactory = artifacts.require('OwnedRegistryFactory')
const keccak256 = require('js-sha3').keccak256
const EthJs = require('ethjs')
const truffleConfig = require('../truffle.js')
const eth = new EthJs(truffleConfig.networks.development2.provider())

let OwnedRegistryFactoryInstance
let FrontierTokenInstance
let TRLInstance
let periodicStagesAddress
let candidateRegistryAddress
let voterRegistryAddress
let PeriodInstance
let PeriodicStagesInstance
let periodAddress

let adminAccount
let voterAccounts
let candidateAccounts

var colors = require('mocha/lib/reporters/base').colors
colors['diff added'] = '30;42'
colors['diff removed'] = '30;41'

// console.log('Provider:' + truffleConfig.networks.rinkeby_infura.provider())

contract('TRL22222', function (accounts) {
  // const rinkebyDeployedAddress = TRLContract.networks['4'].address

  before('Deploying required contracts', async () => {
    let accountssss = await eth.accounts()
    console.log(accountssss[1])
    // adminAccount = await eth.accounts()[0]
    // voterAccounts = await eth.accounts().slice(1, 4)
    // candidateAccounts = await eth.accounts().slice(5, 8)
    voterAccounts = await eth.accounts() // hack

    OwnedRegistryFactoryInstance = await OwnedRegistryFactory.deployed()
    FrontierTokenInstance = await Standard20TokenMock.deployed()
    TRLInstance = await TRLContract.deployed()

    periodicStagesAddress = await TRLInstance.periodicStages.call()
    PeriodicStagesInstance = await PeriodicStageContract.at(periodicStagesAddress)
    periodAddress = await PeriodicStagesInstance.period.call()
    PeriodInstance = await PeriodContract.at(periodAddress)

    console.log('1')
    console.log('At:' + TRLInstance.address)

    // periodicStagesAddress = await TRLInstance.periodicStages.call()

    // candidateRegistryAddress = await OwnedRegistryFactoryInstance.getRegistry.call(keccak256('voter'))
    console.log('2')
    // voterRegistryAddress = await OwnedRegistryFactoryInstance.getRegistry.call(keccak256('candidate'))

    console.log('REgist:' + candidateRegistryAddress)

    /*
 Network: rinkeby_frontier (id: 4)
  Migrations: 0xa440e4ccade65e3720180afeb9e47096e435f6fb
  OwnedRegistryFactory: 0xdf18202a75d34a8284eef18bc0947f1dd1ca3e5a
  Standard20TokenMock: 0x02568b0e480b0af6410a2777681a02213f28d5f0
  TRL: 0x137606d4b19445acedb079f288640ef88087edaa
    */
    // const eth = new EthJs(truffleConfig.networks.development2.provider())

    /*
    let OwnedRegistryFactoryContract = await eth.contract
    let FrontierTokenInstanceABI = await eth.contract
    let TRLInstanceABI = await eth.contract

    // let OwnedRegistryFactoryInstance = await OwnedRegistryFactory.deployed()
    let OwnedRegistryFactoryInstance = await OwnedRegistryFactoryContract.at('0xdcdb3492e3209d20e218de5ad24d62c7c8b903c0')
    let FrontierTokenInstance = await FrontierTokenInstanceABI.at('0x8ddebf99ff9180197d9a36a8d0672eb7587d44d6')
    let TRLInstance = await TRLInstanceABI.at('0x7e5584d9b29f5e9a0c9cef80ded84cbac5b66bd6')
    */
    // const balance = await FrontierTokenInstance.balanceOf.call(eth.accounts[0])
    // console.log('PPP' + JSON.stringify(balance))
    // let voterRegistryAddress = await OwnedRegistryFactoryInstance.getRegistry.call(keccak256('candidate'))
  })

  const runTests = {
    creatingTheContract: false,
    movingPeriods: true,
    staking: false,
    voting: false,
    claiming: false
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
      it('Period number should have been set to 0', async () => {
        const currentPeriod = await TRLInstance.currentPeriod.call()
        assert.equal(0, currentPeriod.toNumber())
      })
      it('Balance of Voter should be set to totalTokens', async () => {
        const balance = await FrontierTokenInstance.balanceOf.call(voterAccounts[0])
        console.log('Balance: ' + balance)
        assert.equal(config.totalTokens, balance.toNumber())
      })
    })
  }

  const promisify = (inner) =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) { reject(err) }

      resolve(res)
    })
  )

  if (runTests.movingPeriods) {
    describe('Moving periods', async () => {
      it('Should increase the period after advancing one period in blocks', async () => {
        const initialPeriod = await TRLInstance.currentPeriod.call()
        console.log('initial: ' + initialPeriod)
        const periodsToAdvance = 1
        let currBlockNumber = await promisify(web3.eth.blockNumber)
        await advanceToBlock.advanceToBlock(currBlockNumber + 1 * config.ttl)
        const currentPeriod = await TRLInstance.currentPeriod.call()
        assert.strictEqual(initialPeriod.toNumber() + periodsToAdvance, currentPeriod.toNumber())
      })

      it('Should increase the period N times after advancing N periods in blocks', async () => {
        const initialPeriod = await TRLInstance.currentPeriod.call()
        const periodsToAdvance = 5
        let currBlockNumber = await eth.blockNumber()
        await advanceToBlock.advanceToBlock(currBlockNumber + periodsToAdvance * config.ttl)
        const currentPeriod = await TRLInstance.currentPeriod.call()
        assert.strictEqual(initialPeriod.toNumber() + periodsToAdvance, currentPeriod.toNumber())
      })

      it('Should increase the stage after moving to the stage position inside the period', async () => {
        const T = config.ttl
        const indexInsideStage = await PeriodInstance.getRelativeIndex()
        const neededIndexInStage = config.activeTime + 1
        const blocksToAdvance = T - indexInsideStage + neededIndexInStage
        let currBlockNumber = await eth.blockNumber()
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
        const blockNumber = await eth.blockNumber()
        await advanceToBlock.advanceToBlock(blockNumber + periodsToAdvance * config.ttl)
      // await advanceToBlock.advanceToBlock(web3.eth.blockNumber + periodsToAdvance * config.ttl)
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
        const requiredVotingLimitAmount = 10
        const votingAmount = requiredVotingLimitAmount + 1
        await TRLInstance.setMaxVotingLimit(requiredVotingLimitAmount, {from: adminAccount})
        await FrontierTokenInstance.approve(TRLInstance.address, votingAmount, {from: voterAccounts[0]})
        await TRLInstance.buyTokenVotes(votingAmount, {from: voterAccounts[0]})
        await assertRevert(TRLInstance.vote(candidateAccounts[0], votingAmount, {from: voterAccounts[0]}))
      })
      it('Should revert when someone tries to vote tokens below the minVotingLimitAmount', async () => {
        const requiredVotingLimitAmount = 10
        const votingAmount = requiredVotingLimitAmount - 1
        await TRLInstance.setMinVotingLimit(requiredVotingLimitAmount, {from: adminAccount})
        await FrontierTokenInstance.approve(TRLInstance.address, votingAmount, {from: voterAccounts[0]})
        await TRLInstance.buyTokenVotes(votingAmount, {from: voterAccounts[0]})
        await assertRevert(TRLInstance.vote(candidateAccounts[0], votingAmount, {from: voterAccounts[0]}))
      })
    })
  }
  if (runTests.claiming) {
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
  }
})
