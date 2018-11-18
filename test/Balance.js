const BalanceContract = artifacts.require('Balance')
const AllowanceContract = artifacts.require('Allowance')

const config = require('../config')
const advanceToBlock = require('./helpers/advanceToBlock')
const { assertRevert } = require('./helpers/assertRevert')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const TRLContract = artifacts.require('TRL')
const VaultContract = artifacts.require('Vault')

contract('TRL<Active>', function (accounts) {
  let ProxyInstance
  let TRLInstance
  let FrontierTokenInstance
  let Vault
  let startTime
  let owner = web3.eth.accounts[0]
  let voterAccounts = web3.eth.accounts.slice(1, 4)
  let candidateAccounts = web3.eth.accounts.slice(5, 8)
  let Allowance
  let Balance

  before('Deploying required contracts', async () => {
    FrontierTokenInstance = await Standard20TokenMock.new(voterAccounts, config.totalTokens, {from: owner})
    Vault = await VaultContract.new({from: owner})
  })
  beforeEach(async () => {
    TRLInstance = await TRLContract.new({from: owner})
    await TRLInstance.setToken(FrontierTokenInstance.address)
    await TRLInstance.setVault(Vault.address)
    await TRLInstance.initPeriod(config.ttl)
    await TRLInstance.initStages(config.activeTime, config.claimTime)

    Allowance = await AllowanceContract.new()
    Balance = await BalanceContract.new(TRLInstance.address, Allowance.address, Vault.address)
  })

  it('Should calculate the balance', async() => {
      // _calculateBalance(uint256 _entityAllowance, uint256 _periodPool)
    const entityAllowance = 40
    const periodPool = 200
    const expectedAllowance = 80
    const actualAllowance = await Balance._calculateBalance(entityAllowance, periodPool)
    assert.equal(actualAllowance, expectedAllowance)
  })

  it('Should be period 0', async() => {
    // _calculateBalance(uint256 _entityAllowance, uint256 _periodPool)

    const balance = await Balance.getBalance(candidateAccounts[0], FrontierTokenInstance.address)
    assert.equal(balance, 0)
  })
})
