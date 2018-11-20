const config = require('../config')
const VaultContract = artifacts.require('Vault')
const { assertRevert } = require('./helpers/assertRevert')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')

contract('Vault', function (accounts) {
  let token
  let vault
  let voterAccounts = web3.eth.accounts.slice(1, 4)

  beforeEach(async () => {
    token = await Standard20TokenMock.new(voterAccounts, config.totalTokens)
    vault = await VaultContract.new()
  })

  it('deposits ERC20s', async () => {
    await token.approve(vault.address, 10, {from: voterAccounts[0]})
    await vault.deposit(0, token.address, voterAccounts[0], 5, {from: voterAccounts[0]})
    assert.equal(await token.balanceOf(vault.address), 5, 'token accounting should be correct')
    assert.equal(await vault.balance(0, token.address), 5, 'vault should know its balance')
  })

  it('transfers tokens', async () => {
    const tokenReceiver = accounts[2]
    const depositAmount = 5
    const transferAmount = 3
    const receiverInitialBalance = await token.balanceOf(tokenReceiver)
    await token.approve(vault.address, 10, {from: voterAccounts[0]})
    await vault.deposit(0, token.address, voterAccounts[0], depositAmount, {from: voterAccounts[0]})
    
    // close vault for the period
    await vault.close(0, token.address)
    
    await vault.transfer(0, token.address, tokenReceiver, transferAmount)
    const receiverFinalBalance = await token.balanceOf(tokenReceiver)
    const vaultBalance = await vault.balance(0, token.address)
    assert.equal(receiverInitialBalance.toNumber() + transferAmount, receiverFinalBalance.toNumber(), 'receiver should have correct token balance')
    assert.equal(depositAmount - transferAmount, vaultBalance.toNumber(), 'Vault should properly updated its balance')
  })

  it('fails if not sufficient token balance available', async () => {
    const approvedAmount = 10
    await token.approve(vault.address, approvedAmount)
    await assertRevert(vault.deposit(0, token.address, accounts[0], approvedAmount * 2))
  })


  it('fails if not sufficient token balance available', async () => {
    const tokenReceiver = accounts[2]
    const depositAmount = 5
    const transferAmount = 3
    const receiverInitialBalance = await token.balanceOf(tokenReceiver)
    await token.approve(vault.address, 10, {from: voterAccounts[0]})
    await vault.deposit(0, token.address, voterAccounts[0], depositAmount, {from: voterAccounts[0]})
    await assertRevert(vault.transfer(0, token.address, tokenReceiver, transferAmount))
  })

  it('Returns the correct bounty pool amount', async () => {
	const vaultBalance = 10
  	await token.approve(vault.address, vaultBalance, {from: voterAccounts[0]})
    await vault.deposit(0, token.address, voterAccounts[0], vaultBalance, {from: voterAccounts[0]})
    await vault.close(0, token.address)
	let actualBountyPoolAmount = await vault.bountyPoolAmount(0, token.address)
	assert.equal(actualBountyPoolAmount, vaultBalance)
  })

 

})
