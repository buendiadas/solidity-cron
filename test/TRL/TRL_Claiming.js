import { advanceBlock } from '../helpers/advanceToBlock';
import latestTime from '../helpers/latestTime'
const config = require('../..//config')
const { increaseTimeTo, duration } = require('../helpers/increaseTime')
const expectThrow  = require('../helpers/expectThrow.js').expectThrow
const { assertRevert } = require('../helpers/assertRevert')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const TRLContract = artifacts.require('TRL')
const OwnedRegistryContract = artifacts.require('OwnedRegistryMock')


contract('TRL<Claiming>', function (accounts) {

  let TRL
  let TRLClaiming
  let FrontierToken
  let CandidateRegistry
  let VoterRegistry
  let startTime
  let voterAccounts=web3.eth.accounts.slice(1,4)
  let candidateAccounts=web3.eth.accounts.slice(5,8)

  const adminAccount = web3.eth.accounts[0]
  const totalTokens = 1000
  const stakedAmount = 100

  const firstCandidateVotes = 1
  const secondCandidateVotes = 2

  beforeEach(async() => {
      FrontierToken = await Standard20TokenMock.new(voterAccounts,totalTokens,{from:adminAccount})
      CandidateRegistry = await OwnedRegistryContract.new(candidateAccounts, 5,{from:adminAccount})
      VoterRegistry = await OwnedRegistryContract.new(voterAccounts,5,{from:adminAccount})
      TRL = await TRLContract.new(FrontierToken.address, CandidateRegistry.address,VoterRegistry.address, config.ttl, config.activeTime, config.claimTime, {from: adminAccount})

      const currentPeriodIndex = await TRL.periodIndex.call()
      const currentPeriod = await TRL.periodRegistry.call(currentPeriodIndex)
      startTime = await currentPeriod[0].toNumber()

      let listAddress= await TRL.address;
      await FrontierToken.approve(listAddress,stakedAmount,{from:voterAccounts[0]})
      await FrontierToken.approve(listAddress,stakedAmount,{from:voterAccounts[1]})
      await TRL.buyTokenVotes(1, {from:voterAccounts[0]})
      await TRL.buyTokenVotes(2, {from:voterAccounts[1]})
      await TRL.vote(candidateAccounts[0], firstCandidateVotes,{from:voterAccounts[0]})
      await TRL.vote(candidateAccounts[1], secondCandidateVotes,{from:voterAccounts[1]})

      await increaseTimeTo(startTime + config.activeTime)
      await TRL.initClaimingState({from:candidateAccounts[0]})
  })
  describe('State: <Claiming>', async () => {
      it('Should transfer a weighted percentage ot the Bounty Pool when the candidate claims a bounty', async () => {
          const initialBalance= await FrontierToken.balanceOf(candidateAccounts[0])
          const currentPeriodIndex = await TRL.periodIndex.call()
          const currentPeriod = await TRL.periodRegistry.call(currentPeriodIndex)
          const listAddress= await TRL.address;
          const periodPool = await FrontierToken.balanceOf(listAddress)
          const totalVotes = currentPeriod[1].toNumber()
          await TRL.claimBounty({from:candidateAccounts[0]})
          const finalBalance = await FrontierToken.balanceOf(candidateAccounts[0])
          const calculatedBalance = firstCandidateVotes/totalVotes * periodPool;
          assert.equal(calculatedBalance, finalBalance)
      })
      it('Should throw when someone tries to stake tokens', async () => {
          const listAddress= await TRL.address
          const isApproved= await FrontierToken.approve(listAddress,stakedAmount,{from:voterAccounts[0]})
          const totalPreStaked = await FrontierToken.allowance.call(voterAccounts[0], listAddress)
          const currentPeriodIndex = await TRL.periodIndex.call()
          await assertRevert(TRL.buyTokenVotes(totalPreStaked, {from:voterAccounts[0]}))
      })
      it('Should change state to <Closed> and move to the next period after claimTTL', async () => {
          const initialPeriodIndex = await TRL.periodIndex.call()
          await increaseTimeTo(startTime + config.ttl+1)

          await TRL.closePeriod({from:candidateAccounts[0]})
          const closedPeriod = await TRL.periodRegistry.call(initialPeriodIndex)
          const pastPeriodState = await closedPeriod[2].toNumber()
          assert.strictEqual (3, pastPeriodState)
          const newPeriodIndex = await TRL.periodIndex.call()
          const expectedPeriod = initialPeriodIndex.toNumber() + 1;
          assert.strictEqual(expectedPeriod,newPeriodIndex.toNumber())
      })
  })
})
