const config = require('../config')
const { assertRevert } = require('./helpers/assertRevert')
const VoteTokenContract =  artifacts.require('VoteToken')
const PeriodContract = artifacts.require('PeriodMock')

contract('VokeToken', function (accounts) {
  let VoteTokenInstance
  let TokenControllerInstance
  let PeriodInstance
  let mintedAmount = 10
  let adminAccount = web3.eth.accounts[0]
  let voterAccounts = web3.eth.accounts.slice(1, 4)
  let candidateAccounts = web3.eth.accounts.slice(5, 8)

  beforeEach(async () => {
    VoteTokenInstance = await VoteTokenContract.new({from: adminAccount})
    PeriodInstance = await PeriodContract.new({from: adminAccount})
    VoteTokenInstance.setPeriod(PeriodInstance.address)
  })
  describe('Creating the contract', async () => {
    it('Should have  initialized the period instance', async () => {
      const periodAddress = await VoteTokenInstance.period();
      assert.strictEqual(PeriodInstance.address, periodAddress)
    })
  })
  describe('Total Supply', async () => {
    it('Starts being 0', async () => {
      const supply = await VoteTokenInstance.totalSupply();
      assert.strictEqual(0, supply.toNumber())
    })
    it('Increments after minting', async () => {
      await VoteTokenInstance.mint(voterAccounts[0], mintedAmount)
      const supply = await VoteTokenInstance.totalSupply();
      assert.strictEqual(mintedAmount, supply.toNumber())
    })
  })
  describe('Balance', async () => {
    it('Starts being 0', async () => {
      const balance = await VoteTokenInstance.balanceOf(voterAccounts[0]);
      assert.strictEqual(0, balance.toNumber())
    })
    it('Increments after minting', async () => {
      await VoteTokenInstance.mint(voterAccounts[0],mintedAmount)
      const balance = await VoteTokenInstance.balanceOf(voterAccounts[0]);
      assert.strictEqual(mintedAmount, balance.toNumber())
    })
    it('Restarts after a height increment, and tracks previous balance', async () => {
      await VoteTokenInstance.mint(voterAccounts[0],mintedAmount)
      await PeriodInstance.next();
      const balance = await VoteTokenInstance.balanceOf(voterAccounts[0]);
      assert.strictEqual(0,  balance.toNumber())
      const prevBalance = await VoteTokenInstance.balanceAt(0, voterAccounts[0])
      assert.strictEqual(mintedAmount, prevBalance.toNumber())
    })
  })
  describe('Allowance', async () => {
    it('Returns balance if sender is owner, 0 otherwise', async () => {
      await VoteTokenInstance.mint(voterAccounts[0],mintedAmount)
      const allowanceAdmin = await VoteTokenInstance.allowance(voterAccounts[0], adminAccount);
      assert.strictEqual(mintedAmount,  allowanceAdmin.toNumber())
      const allowanceCandidate = await VoteTokenInstance.allowance(voterAccounts[0], candidateAccounts[0]);
      assert.strictEqual(0, allowanceCandidate.toNumber())
    })
  })
  describe('Disabled ERC20 functions', async () => {
    it('Not revert for `transfer` and `approve`', async () => {
      const transferResult = await VoteTokenInstance.transfer(voterAccounts[0], 10)
      const allowanceResult = await VoteTokenInstance.approve(voterAccounts[0], 10)
      assert(true)
    })
  })
})
