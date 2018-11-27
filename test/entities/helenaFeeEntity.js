/* global artifacts, contract, web3, beforeEach, assert, it */

const BalanceContract = artifacts.require('Bank')
const AllowanceContract = artifacts.require('Allowance')
const HelenaFeeContract = artifacts.require('helenaAgent')

const config = require('../../config')
const { assertRevert } = require('../helpers/assertRevert')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const TRLContract = artifacts.require('TRL')
const VaultContract = artifacts.require('Vault')

contract('TRL<Active>', function (accounts) {
  let FrontierTokenInstance
  let Vault
  let owner = web3.eth.accounts[0]
  let voterAccounts = web3.eth.accounts.slice(1, 4)
  let candidateAccounts = web3.eth.accounts.slice(5, 8)
  let Allowance
  let Balance
  const totalTokenIssuance = 100 * 1000

  const receiver = candidateAccounts[1]
  const wrongReceiver = candidateAccounts[2]

  let period = 0

  let HelenaFeeEntityInstance

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
    Balance = await BalanceContract.new(
      Allowance.address,
      Vault.address
    )
    HelenaFeeEntityInstance = await HelenaFeeContract.new(
      Vault.address,
      Balance.address
    )
    await Allowance.addEntity(
      HelenaFeeEntityInstance.address,
      'Helena-fee',
      100,
      period
    )
    await HelenaFeeEntityInstance.addAllowedReceiver(
      receiver,
      FrontierTokenInstance.address,
      { from: owner }
    )
    await Balance.setBalancesForEntities([HelenaFeeEntityInstance.address], FrontierTokenInstance.address, period)
    await Vault.setBankContractAddress(Balance.address, { from: owner })
  })

  it('Should make the payment to the Receiver', async () => {
    // _calculateBalance(uint256 _entityAllowance, uint256 _periodPool)
    await HelenaFeeEntityInstance.collectPayment(
      receiver,
      FrontierTokenInstance.address,
      period
    )
    const receiverBalance = await FrontierTokenInstance.balanceOf(receiver)
    assert.equal(receiverBalance, totalTokenIssuance)
  })
  it('Should fail for unauthorized receiver', async () => {
    await assertRevert(
      HelenaFeeEntityInstance.collectPayment(
      wrongReceiver,
      FrontierTokenInstance.address,
      period
      )
    )
  })
})
