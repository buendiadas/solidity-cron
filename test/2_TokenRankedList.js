import { advanceBlock } from './helpers/advanceToBlock';
import latestTime from './helpers/latestTime'
const { increaseTimeTo, duration } = require('./helpers/increaseTime')
const expectThrow  = require('./helpers/expectThrow.js').expectThrow
const { assertRevert } = require('./helpers/assertRevert')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const TRLContract = artifacts.require('TRL')
const OwnedRegistryContract = artifacts.require('OwnedRegistryMock')


let TRL
let FrontierToken
let CandidateRegistry
let VoterRegistry

contract('TRL', function (accounts) {

  const maxNumCandidates=5
  const adminAccount= web3.eth.accounts[0]
  const candidateAccount= web3.eth.accounts[1]
  const voterAccount= web3.eth.accounts[2]
  const bountyPoolAccount= 0x00
  const totalTokens=1000
  const stakedAmount=100
  const initialTTL = 1000
  let startTime

  beforeEach(async() => {
      FrontierToken = await Standard20TokenMock.new(voterAccount, voterAccount, totalTokens,{from: adminAccount})
      CandidateRegistry = await OwnedRegistryContract.new(candidateAccount, maxNumCandidates,{from : adminAccount})
      VoterRegistry = await OwnedRegistryContract.new(voterAccount, maxNumCandidates,{from : adminAccount})
      TRL = await TRLContract.new(FrontierToken.address, CandidateRegistry.address,VoterRegistry.address,initialTTL, {from: adminAccount})
      const currentPeriodIndex = await TRL.periodIndex.call()
      const currentPeriod = await TRL.periodRegistry.call(currentPeriodIndex)
      startTime = await currentPeriod[0].toNumber()
  })
  describe('Creating the contract', async () => {
      it('Should have set the correct token as the token voting address', async () => {
          const contractTokenAddress = await TRL.token.call()
          const testingTokenAddress= await FrontierToken.address
          assert.strictEqual(testingTokenAddress,contractTokenAddress)
      })
      it('Should have set the correct candidateRegistry address', async () => {
          const tokenCandidateRegistryAddress = await TRL.candidateRegistry.call()
          const candidateRegistryAddress= await CandidateRegistry.address
          assert.strictEqual(candidateRegistryAddress,tokenCandidateRegistryAddress)
      })
      it('Should have set the correct voterRegistry address', async () => {
          const tokenVoterRegistryAddress = await TRL.voterRegistry.call()
          const voterRegistryAddress= await VoterRegistry.address
          assert.strictEqual(voterRegistryAddress,tokenVoterRegistryAddress)
      })
      it('Period should have been set to 0', async () => {
          const currentPeriod= await TRL.periodIndex.call()
          assert.equal(0, currentPeriod.toNumber())
      })
      it('Initial Period TTL should have been set to initialTTL', async () => {
          const currentPeriodIndex = await TRL.periodIndex.call()
          const currentPeriod = await TRL.periodRegistry.call(currentPeriodIndex)
          const currentTTL = await currentPeriod[3].toNumber()
          assert.strictEqual(initialTTL, currentTTL)
      })
      it('Balance of Voter should be set to totalTokens', async () => {
          const balance= await FrontierToken.balanceOf.call(voterAccount)
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
          await assertRevert(TRL.claimBounty({from:candidateAccount}))
      })
      it('Should throw when someone tries to move to Claiming state 1 ms before TTL', async () => {
          await increaseTimeTo(startTime + initialTTL -1);
          await assertRevert(TRL.initClaimingState({from:candidateAccount}))
      })
      it('Should enable to stake Tokens', async () => {
          const listAddress= await TRL.address
          const isApproved= await FrontierToken.approve(listAddress,stakedAmount,{from:voterAccount})
          const totalPreStaked = await FrontierToken.allowance.call(voterAccount, listAddress)
          const currentPeriodIndex = await TRL.periodIndex.call()
          await TRL.buyTokenVotes(totalPreStaked, {from:voterAccount})
          const votingBalance = await TRL.votesBalance.call(currentPeriodIndex,voterAccount)
          assert.equal(totalPreStaked,votingBalance.toNumber())
      })
      it('Should increase the number of votes received per analyst in the period after voting', async () => {
          const listAddress= await TRL.address
          const isApproved= await FrontierToken.approve(listAddress,stakedAmount,{from:voterAccount})
          const totalPreStaked = await FrontierToken.allowance.call(voterAccount, listAddress)
          const currentPeriodIndex = await TRL.periodIndex.call()
          await TRL.buyTokenVotes(totalPreStaked, {from:voterAccount})
          const votingBalance = await TRL.votesBalance.call(currentPeriodIndex,voterAccount)
          await TRL.vote(candidateAccount,votingBalance,{from:voterAccount})
          const votesReceived = await TRL.votesReceived.call(currentPeriodIndex,candidateAccount)
          assert.equal(votingBalance.toNumber(), votesReceived.toNumber())
      })
      it('Should change state to <Claiming> when someone tries to move to Claiming state after TTL', async () => {
          await increaseTimeTo(startTime + initialTTL + 1)
          await TRL.initClaimingState({from:candidateAccount})
          const currentPeriodIndex = await TRL.periodIndex.call()
          const currentPeriod = await TRL.periodRegistry.call(currentPeriodIndex)
          const currentState = await currentPeriod[2].toNumber()
          assert.strictEqual(2, currentState)
      })
  })
})
