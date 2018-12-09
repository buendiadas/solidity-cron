const config = require('../config')
const advanceToBlock = require('./helpers/advanceToBlock')
const { assertRevert } = require('./helpers/assertRevert')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const VoteTokenContract =  artifacts.require('VoteToken')
const TRLContract = artifacts.require('TRL')
const PeriodContract = artifacts.require('PeriodMock');
const VaultContract = artifacts.require('Vault')
const OwnedRegistryContract = artifacts.require('OwnedRegistryMock')

contract('TRL', function (accounts) {
  let ProxyInstance
  let TRLInstance
  let FrontierTokenInstance
  let CandidateRegistryInstance
  let VoterRegistryInstance
  let VoteTokenInstance
  let PeriodicStagesInstance
  let ScoringInstance
  let Vault
  let PeriodInstance
  let startTime
  let adminAccount = web3.eth.accounts[0]
  let voterAccounts = web3.eth.accounts.slice(1, 4)
  let candidateAccounts = web3.eth.accounts.slice(5, 8)

  before('Deploying required contracts', async () => {
    FrontierTokenInstance = await Standard20TokenMock.new(voterAccounts, config.totalTokens, {from: adminAccount})
    CandidateRegistryInstance = await OwnedRegistryContract.new(candidateAccounts, {from: adminAccount})
    VoterRegistryInstance = await OwnedRegistryContract.new(voterAccounts, {from: adminAccount})
    Vault = await VaultContract.new({from: adminAccount})
    PeriodInstance = await PeriodContract.new()
  })
  beforeEach(async () => {
    VoteTokenInstance = await VoteTokenContract.new({from: adminAccount});
    TRLInstance = await TRLContract.new({from: adminAccount})
    await TRLInstance.setToken(FrontierTokenInstance.address)
    await TRLInstance.setVoteToken(VoteTokenInstance.address)
    await VoteTokenInstance.transferOwnership(TRLInstance.address, {from: adminAccount})
    await TRLInstance.setCandidateRegistry(CandidateRegistryInstance.address)
    await TRLInstance.setVoterRegistry(VoterRegistryInstance.address)
    await TRLInstance.setVault(Vault.address)
    await TRLInstance.setPeriod(PeriodInstance.address)
    await VoteTokenInstance.setPeriod(PeriodInstance.address)

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
    it('Should have set the correct PeriodicContract address', async () => {
      const periodStoredAddress = await TRLInstance.period.call()
      const periodInstanceAddress = await PeriodInstance.address
      assert.strictEqual(periodInstanceAddress, periodStoredAddress)
    })
    it('Should have set the correct VoteToken address', async () => {
      const voteTokenStoredAddress = await TRLInstance.voteToken.call()
      assert.strictEqual(VoteTokenInstance.address, voteTokenStoredAddress)
    })
    it('Period number should have been set to 0', async () => {
      const currentPeriod = await TRLInstance.currentPeriod.call()
      const height = await PeriodInstance.height.call()
      assert.equal(0, height.toNumber())
      assert.equal(0, currentPeriod.toNumber())
    })
    it('Balance of Voter should be set to totalTokens', async () => {
      const balance = await FrontierTokenInstance.balanceOf.call(voterAccounts[0])
      assert.equal(config.totalTokens, balance.toNumber())
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
    it('Should not throw wen buying votes if balance is enough', async () => {
      const stakedTokens = 10
      const listAddress = await TRLInstance.address
      await FrontierTokenInstance.approve(listAddress, stakedTokens, {from: voterAccounts[0]})
      await TRLInstance.buyTokenVotes(stakedTokens, {from: voterAccounts[0]})
      assert(true)
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
      const owner = await VoteTokenInstance.owner();
      await assertRevert(TRLInstance.buyTokenVotes(definedMinimumStake - 1, {from: voterAccounts[0]}))
    })
    it('Should record the number of votes bought in period 0 on the first period', async () => {
      const listAddress = await TRLInstance.address
      const stakedTokens = 10
      await FrontierTokenInstance.approve(listAddress, stakedTokens, {from: voterAccounts[0]})
      const totalPreStaked = await FrontierTokenInstance.allowance.call(voterAccounts[0], listAddress)
      const height = await TRLInstance.height.call()
      await TRLInstance.buyTokenVotes(totalPreStaked, {from: voterAccounts[0]})
      const votingBalance = await VoteTokenInstance.balanceOf(voterAccounts[0])
      assert.equal(totalPreStaked, votingBalance.toNumber())
    })
    it('Should record the number of staked tokens in period N on the future periods', async () => {
      const listAddress = await TRLInstance.address
      const stakedTokens = 10
      await FrontierTokenInstance.approve(listAddress, stakedTokens, {from: voterAccounts[0]})
      const totalPreStaked = await FrontierTokenInstance.allowance.call(voterAccounts[0], listAddress)
      const periodsToAdvance = 5
      for(let  i =0; i < 5; i ++){
        await PeriodInstance.next()
      }
      const height = await TRLInstance.height.call()
      await TRLInstance.buyTokenVotes(totalPreStaked, {from: voterAccounts[0]})
      const votingBalance = await VoteTokenInstance.balanceOf(voterAccounts[0])
      assert.equal(totalPreStaked, votingBalance.toNumber())
    })
  })
  describe('Voting', async () => {
    it('Should increase the number of votes received per analyst in the period after voting', async () => {
      const stakedTokens = 10
      const listAddress = await TRLInstance.address
      await FrontierTokenInstance.approve(listAddress, stakedTokens, {from: voterAccounts[0]})
      await TRLInstance.buyTokenVotes(stakedTokens, {from: voterAccounts[0]})
      await TRLInstance.vote(candidateAccounts[0], stakedTokens, {from: voterAccounts[0]})
      const votesReceived = await VoteTokenInstance.balanceOf(candidateAccounts[0])
      assert.equal(true, true)
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
      const initialPeriod = await TRLInstance.height.call()
      const periodsToAdvance = 5
      for(let  i =0; i < 5; i ++){
        await PeriodInstance.next()
      }
      await TRLInstance.buyTokenVotes(totalPreStaked, {from: voterAccounts[0]})
      const votingBalance = await VoteTokenInstance.balanceOf(voterAccounts[0])
      await TRLInstance.vote(candidateAccounts[0], votingBalance, {from: voterAccounts[0]})
      const votesReceived = await VoteTokenInstance.balanceOf(candidateAccounts[0])
      assert.equal(votingBalance.toNumber(), votesReceived.toNumber())
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
  describe('Scoring', async () => {
    it('Should return the same value as the set scoring algorithm', async () => {
      const stakedTokens = 10
      await FrontierTokenInstance.approve(TRLInstance.address, stakedTokens, {from: voterAccounts[0]})
      await TRLInstance.buyTokenVotes(stakedTokens, {from: voterAccounts[0]})
      const votingBalance = await VoteTokenInstance.balanceOf(voterAccounts[0])
      const epoch = await TRLInstance.height();
      await TRLInstance.vote(candidateAccounts[0], votingBalance, {from: voterAccounts[0]})
      const TRLScoring = await TRLInstance.scoring.call(epoch, candidateAccounts[0])
      assert.strictEqual(stakedTokens, TRLScoring.toNumber())
    })
  })
  describe('Test event', async () => {
    it('Should emit the test event', async () => {
      const listAddress = await TRLInstance.address
      try {
        await TRLInstance.launchTestEvent()
        assert.equal(1, 1)
      } catch (e) {
        assert.equal(1, 2)
      }
    })
  })
})
