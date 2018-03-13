const expectThrow  = require('./helpers/expectThrow.js').expectThrow
const { assertRevert } = require('./helpers/assertRevert')


const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const TokenRankedListContract = artifacts.require('TokenRankedList')
const OwnedRegistryContract = artifacts.require('OwnedRegistry')
const MAXNUMCANDIDATES=5
const ADMIN_ACCOUNT= web3.eth.accounts[0]
const CANDIDATE_ACCOUNT= web3.eth.accounts[1]
const VOTER_ACCOUNT= web3.eth.accounts[2]
const BOUNTY_POOL_ACCOUNT= 0x00
const TOTAL_TOKENS=1000
const STAKED_AMOUNT=100
const INITIAL_TTL = 10

let TokenRankedList
let FrontierToken
let CandidateRegistry
let VoterRegistry

contract('TokenRankedList', function (accounts) {
  beforeEach(async() => {
    FrontierToken = await Standard20TokenMock.new(VOTER_ACCOUNT, VOTER_ACCOUNT, TOTAL_TOKENS,{from: ADMIN_ACCOUNT})
    CandidateRegistry = await OwnedRegistryContract.new(MAXNUMCANDIDATES,{from : ADMIN_ACCOUNT})
    VoterRegistry = await OwnedRegistryContract.new(MAXNUMCANDIDATES,{from : ADMIN_ACCOUNT})
    TokenRankedList = await TokenRankedListContract.new(FrontierToken.address, CandidateRegistry.address,VoterRegistry.address,INITIAL_TTL, {from: ADMIN_ACCOUNT})
  })
  describe('Creating the contract', async () => {
      it('Should have set the correct token as the token voting address', async () => {
        const contractTokenAddress = await TokenRankedList.token.call()
        const testingTokenAddress= await FrontierToken.address
        assert.strictEqual(testingTokenAddress,contractTokenAddress)
      })
      it('Should have set the correct candidateRegistry address', async () => {
        const tokenCandidateRegistryAddress = await TokenRankedList.candidateRegistry.call()
        const candidateRegistryAddress= await CandidateRegistry.address
        assert.strictEqual(candidateRegistryAddress,tokenCandidateRegistryAddress)
      })
      it('Should have set the correct voterRegistry address', async () => {
        const tokenVoterRegistryAddress = await TokenRankedList.voterRegistry.call()
        const voterRegistryAddress= await VoterRegistry.address
        assert.strictEqual(voterRegistryAddress,tokenVoterRegistryAddress)
      })
      it('Period should have been set to 0', async () => {
        const currentPeriod= await TokenRankedList.periodIndex.call()
        assert.equal(0, currentPeriod.toNumber())
      })
      it('State of the current Period should be active from the start', async () => {
        const currentPeriodIndex = await TokenRankedList.periodIndex.call()
        const currentPeriod = await TokenRankedList.periods.call(currentPeriodIndex)
        const currentState = await currentPeriod[2].toNumber()
        assert.strictEqual(1, currentState)
      })
      it('Initial Period TTL should have been set to INITIAL_TTL', async () => {
        const currentPeriodIndex = await TokenRankedList.periodIndex.call()
        const currentPeriod = await TokenRankedList.periods.call(currentPeriodIndex)
        const currentTTL = await currentPeriod[3].toNumber()
        assert.strictEqual(INITIAL_TTL, currentTTL)
      })
      it('Balance of Voter should be set to TOTAL_TOKENS', async () => {
        const balance= await FrontierToken.balanceOf.call(VOTER_ACCOUNT)
        assert.equal(TOTAL_TOKENS, balance.toNumber())
      })
  })
  describe('State:Active', async () => {
      it('Should approve an amount of tokens using the token (Stake)', async () => {
        let listAddress= await TokenRankedList.address
        let isApproved= await FrontierToken.approve(listAddress, STAKED_AMOUNT,{from:VOTER_ACCOUNT})
        let totalStaked = await FrontierToken.allowance.call(VOTER_ACCOUNT, listAddress)
        assert.equal(STAKED_AMOUNT,totalStaked)
      })
      it('Should increase the number of votes in the period', async () => {
        let listAddress= await TokenRankedList.address
        let newVoter= VOTER_ACCOUNT
        await TokenRankedList.addVoter(newVoter)
        await FrontierToken.approve(listAddress, STAKED_AMOUNT,{from:VOTER_ACCOUNT})
        await TokenRankedList.buyTokenVotes(STAKED_AMOUNT, {from:VOTER_ACCOUNT})
        let votesBalance = await TokenRankedList.votesBalance.call(0, VOTER_ACCOUNT)
        assert.equal(STAKED_AMOUNT, votesBalance)
      })
  })
  describe('Staking', async () => {
      it('Should approve an amount of tokens using the token (Stake)', async () => {
        let listAddress= await TokenRankedList.address
        let isApproved= await FrontierToken.approve(listAddress, STAKED_AMOUNT,{from:VOTER_ACCOUNT})
        let totalStaked = await FrontierToken.allowance.call(VOTER_ACCOUNT, listAddress)
        assert.equal(STAKED_AMOUNT,totalStaked)
      })
      it('Should increase the number of votes in the period', async () => {
        let listAddress= await TokenRankedList.address
        let newVoter= VOTER_ACCOUNT
        await TokenRankedList.addVoter(newVoter)
        await FrontierToken.approve(listAddress, STAKED_AMOUNT,{from:VOTER_ACCOUNT})
        await TokenRankedList.buyTokenVotes(STAKED_AMOUNT, {from:VOTER_ACCOUNT})
        let votesBalance = await TokenRankedList.votesBalance.call(0, VOTER_ACCOUNT)
        assert.equal(STAKED_AMOUNT, votesBalance)
      })
  })
  describe('Voting', async () => {
      it('Should throw if the vote comes from a voter without enough stake', async () => {
        let newCandidate= CANDIDATE_ACCOUNT
        await TokenRankedList.addCandidate(newCandidate)
        let newVoter= VOTER_ACCOUNT
        await TokenRankedList.addVoter(newVoter)
        await assertRevert(TokenRankedList.vote(CANDIDATE_ACCOUNT,STAKED_AMOUNT,{from:newVoter}))
      })
      it('Token should not enable transferFrom from admin', async () => {
        await FrontierToken.approve(ADMIN_ACCOUNT,STAKED_AMOUNT,{from:VOTER_ACCOUNT})
        let isAllowed= await FrontierToken.allowance.call(VOTER_ACCOUNT, ADMIN_ACCOUNT)
        let isTransfered = await FrontierToken.transferFrom.call(ADMIN_ACCOUNT, 0x00, STAKED_AMOUNT)
        assert.equal(false, isTransfered)
      })
      it('Token should enable transferFrom from Voter', async () => {
        await FrontierToken.approve(ADMIN_ACCOUNT,STAKED_AMOUNT,{from:VOTER_ACCOUNT})
        let isAllowed= await FrontierToken.allowance.call(VOTER_ACCOUNT, ADMIN_ACCOUNT)
        let isTransfered = await FrontierToken.transferFrom.call(VOTER_ACCOUNT, 0x00, STAKED_AMOUNT)
        assert.equal(true, isTransfered)
      })
      it('Approval should have been set', async () => {
        let isApproved = await FrontierToken.approve.call(ADMIN_ACCOUNT,STAKED_AMOUNT,{from:VOTER_ACCOUNT})
        assert.equal(true, isApproved)
      })
      it('Balance of Voter should be set to TOTAL_AMOUNT', async () => {
        await FrontierToken.approve(ADMIN_ACCOUNT,STAKED_AMOUNT,{from:VOTER_ACCOUNT})
        let balance= await FrontierToken.balanceOf.call(VOTER_ACCOUNT)
        assert.equal(TOTAL_TOKENS, balance.toNumber())
      })
      it('Should add votes if the voter approved the specified stake', async () => {
        let newCandidate= CANDIDATE_ACCOUNT
        await TokenRankedList.addCandidate(newCandidate)
        let newVoter= VOTER_ACCOUNT
        let listAddress= await TokenRankedList.address
        await TokenRankedList.addVoter(newVoter)
        await FrontierToken.approve(listAddress,STAKED_AMOUNT,{from:VOTER_ACCOUNT})
        await FrontierToken.allowance.call(VOTER_ACCOUNT, listAddress)
        await TokenRankedList.vote(CANDIDATE_ACCOUNT,STAKED_AMOUNT,{from:VOTER_ACCOUNT})
        let totalVotes= await TokenRankedList.votesReceived.call(CANDIDATE_ACCOUNT)
        assert.equal(STAKED_AMOUNT,totalVotes.toNumber())
      })
      it('Should have increased the balance of tokens of the voting pool by the number of votes', async () => {
        let newCandidate= CANDIDATE_ACCOUNT
        await TokenRankedList.addCandidate(newCandidate)
        let newVoter= VOTER_ACCOUNT
        let listAddress= await TokenRankedList.address
        await TokenRankedList.addVoter(newVoter)
        await FrontierToken.approve(listAddress,STAKED_AMOUNT,{from:VOTER_ACCOUNT})
        await FrontierToken.allowance.call(VOTER_ACCOUNT, listAddress)
        await TokenRankedList.vote(CANDIDATE_ACCOUNT,STAKED_AMOUNT,{from:VOTER_ACCOUNT})
        let totalVotes= await TokenRankedList.votesReceived.call(CANDIDATE_ACCOUNT)
        let bountyPoolBalance= await FrontierToken.balanceOf.call(BOUNTY_POOL_ACCOUNT)
        assert.equal(totalVotes.toNumber(),bountyPoolBalance.toNumber())
      })
  })
})
