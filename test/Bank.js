/* global artifacts, contract, web3, beforeEach, assert, it */

const BankContract = artifacts.require('Bank')
const AllowanceContract = artifacts.require('Allowance')

const config = require('../config')
const { assertRevert } = require('./helpers/assertRevert')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const TRLContract = artifacts.require('TRL')
const VaultContract = artifacts.require('Vault')

contract('Bank', function (accounts) {
  let FrontierTokenInstance
  let Vault
  let owner = web3.eth.accounts[0]
  let voterAccounts = web3.eth.accounts.slice(1, 4)
  let candidateAccounts = web3.eth.accounts.slice(5, 8)
  let Allowance
  let Bank

  const entity1 = voterAccounts[0]
  const entity2 = voterAccounts[1]
  const entity3 = voterAccounts[2]
  const totalTokenIssuance = 100 * 1000

  const entity1Allowance = 50
  const entity2Allowance = 20
  const entity3Allowance = 10

  const receiver = candidateAccounts[1]

  let period = 0

  beforeEach(async () => {
    // creting token instance
    FrontierTokenInstance = await Standard20TokenMock.new(
      voterAccounts,
      totalTokenIssuance,
      { from: owner }
    )
    // Creating Vault
    Vault = await VaultContract.new({ from: owner })
    // Approving trasfer to fund Vault
    await FrontierTokenInstance.approve(Vault.address, totalTokenIssuance, {
      from: voterAccounts[0]
    })
    // Funding Vault
    await Vault.deposit(
      0,
      FrontierTokenInstance.address,
      voterAccounts[0],
      totalTokenIssuance,
      { from: voterAccounts[0] }
    )

    await Vault.close(0, FrontierTokenInstance.address)

    Allowance = await AllowanceContract.new()
    Bank = await BankContract.new(
      Allowance.address,
      Vault.address
    )
    await Vault.setBankContractAddress(Bank.address, { from: owner })
  })

  it('Should calculate the balance', async () => {
    // _calculateBalance(uint256 _entityAllowance, uint256 _periodPool)
    const entityAllowance = 40
    const periodPool = 200
    const expectedAllowance = 80
    const actualAllowance = await Bank._calculateBalance(
      entityAllowance,
      periodPool
    )
    assert.equal(actualAllowance, expectedAllowance)
  })

  it('Should be period 0', async () => {
    // _calculateBalance(uint256 _entityAllowance, uint256 _periodPool)

    const balance = await Bank.getBalance(
      candidateAccounts[0],
      FrontierTokenInstance.address,
      period
    )
    assert.equal(balance, 0)
  })

  it('Should calculate the correct amount', async () => {
    await Allowance.addEntity(entity1, 'entity-1', entity1Allowance, period)
    await Allowance.addEntity(entity2, 'entity-2', entity2Allowance, period)
    await Allowance.addEntity(entity3, 'entity-3', entity3Allowance, period)
    await Bank.setBalancesForEntities(
      [entity1, entity2, entity3],
      FrontierTokenInstance.address,
      period,
      { from: owner }
    )
    const setBalance1 = await Bank.getBalance(
      entity1,
      FrontierTokenInstance.address,
      period
    )
    const setBalance2 = await Bank.getBalance(
      entity2,
      FrontierTokenInstance.address,
      period
    )
    const setBalance3 = await Bank.getBalance(
      entity3,
      FrontierTokenInstance.address,
      period
    )
    assert.equal(
      setBalance1,
      totalTokenIssuance * entity1Allowance / 100,
      'Balance of entity' + 1 + 'wrong'
    )
    assert.equal(
      setBalance2,
      totalTokenIssuance * entity2Allowance / 100,
      'Balance of entity' + 2 + 'wrong'
    )
    assert.equal(
      setBalance3,
      totalTokenIssuance * entity3Allowance / 100,
      'Balance of entity' + 3 + 'wrong'
    )
  })

  it('Should return the correct balance after withdraw', async () => {
    await Allowance.addEntity(entity1, 'entity-1', entity1Allowance, period)
    await Bank.setBalancesForEntities(
      [entity1],
      FrontierTokenInstance.address,
      period,
      { from: owner }
    )
    const initialBalance = await Bank.getBalance(
      entity1,
      FrontierTokenInstance.address,
      period
    )
    const withdrawAmount = 100
    await Bank.makePayment(
      entity1,
      receiver,
      FrontierTokenInstance.address,
      withdrawAmount,
      period
    )
    const afterBalance = await Bank.getBalance(
      entity1,
      FrontierTokenInstance.address,
      period
    )

    const receiverBalance = await FrontierTokenInstance.balanceOf(receiver)
    const originalBalanceAfterTransfer = await Bank.getStartingBalance(entity1, FrontierTokenInstance.address, period);

    // Checking the receiver got the correct amount of funds
    assert.equal(
      receiverBalance,
      withdrawAmount,
      'Wrong amount transfered to receiver'
    )

    // Checking the entity's balance correctly decreased
    assert.equal(
      afterBalance,
      initialBalance - withdrawAmount,
      'Balance after withdrawal is wrong'
    )
	assert.equal(
      parseInt(originalBalanceAfterTransfer),
      parseInt(initialBalance),
      'Bank original balance is wrong'
    )
  })

  it('Should fail when withdrawing too much', async () => {
    await Allowance.addEntity(entity1, 'entity-1', entity1Allowance, period)
    await Bank.setBalancesForEntities(
      [entity1],
      FrontierTokenInstance.address,
      period,
      { from: owner }
    )
    const initialBalance = await Bank.getBalance(
      entity1,
      FrontierTokenInstance.address,
      period
    )
    const withdrawAmount = initialBalance + 1
    await assertRevert(
      Bank.makePayment(
        entity1,
        receiver,
        FrontierTokenInstance.address,
        withdrawAmount,
        period
      )
    )
  })
})
