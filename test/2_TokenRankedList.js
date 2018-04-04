const { increaseTimeTo, duration } = require('./helpers/increaseTime')
const expectThrow  = require('./helpers/expectThrow.js').expectThrow
const { assertRevert } = require('./helpers/assertRevert')


const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const TRLContract = artifacts.require('TRL')
const OwnedRegistryContract = artifacts.require('OwnedRegistryMock')
const MAXNUMCANDIDATES=5
const ADMIN_ACCOUNT= web3.eth.accounts[0]
const CANDIDATE_ACCOUNT= web3.eth.accounts[1]
const VOTER_ACCOUNT= web3.eth.accounts[2]
const BOUNTY_POOL_ACCOUNT= 0x00
const TOTAL_TOKENS=1000
const STAKED_AMOUNT=100
const INITIAL_TTL = 1000

let TRL
let FrontierToken
let CandidateRegistry
let VoterRegistry

contract('TRL', function (accounts) {
  beforeEach(async() => {
      FrontierToken = await Standard20TokenMock.new(VOTER_ACCOUNT, VOTER_ACCOUNT, TOTAL_TOKENS,{from: ADMIN_ACCOUNT})
      CandidateRegistry = await OwnedRegistryContract.new(CANDIDATE_ACCOUNT, MAXNUMCANDIDATES,{from : ADMIN_ACCOUNT})
      VoterRegistry = await OwnedRegistryContract.new(CANDIDATE_ACCOUNT, MAXNUMCANDIDATES,{from : ADMIN_ACCOUNT})
      TRL = await TRLContract.new(FrontierToken.address, CandidateRegistry.address,VoterRegistry.address,INITIAL_TTL, {from: ADMIN_ACCOUNT})
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
      it('Initial Period TTL should have been set to INITIAL_TTL', async () => {
          const currentPeriodIndex = await TRL.periodIndex.call()
          const currentPeriod = await TRL.periodRegistry.call(currentPeriodIndex)
          const currentTTL = await currentPeriod[3].toNumber()
          assert.strictEqual(INITIAL_TTL, currentTTL)
      })
      it('Balance of Voter should be set to TOTAL_TOKENS', async () => {
          const balance= await FrontierToken.balanceOf.call(VOTER_ACCOUNT)
          assert.equal(TOTAL_TOKENS, balance.toNumber())
      })
  })
  describe('State: ACTIVE', async () => {
      it('First Period should have initially an ACTIVE state', async () => {
          const currentPeriodIndex = await TRL.periodIndex.call()
          const currentPeriod = await TRL.periodRegistry.call(currentPeriodIndex)
          const currentState = await currentPeriod[2].toNumber()
          assert.strictEqual(1, currentState)
      })
      it('Should throw when someone tries to claim a Bounty', async () => {
          await assertRevert(TRL.claimBounty({from:CANDIDATE_ACCOUNT}))
      })
      it('Should throw when someone tries to move to Claiming state', async () => {
          const currentPeriodIndex = await TRL.periodIndex.call()
          const currentPeriod = await TRL.periodRegistry.call(currentPeriodIndex)
          const currentTTL = await currentPeriod[3].toNumber()
          await assertRevert(TRL.initClaimingState({from:CANDIDATE_ACCOUNT}))
      })
  })
})
