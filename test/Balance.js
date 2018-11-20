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

		const entity1 = voterAccounts[0]
		const entity2 = voterAccounts[1]
		const entity3 = voterAccounts[2]
		const totalTokenIssuance = 100*1000

		const entity1Allowance = 50
		const entity2Allowance = 20
		const entity3Allowance = 10

		const impossibleAllowance = 101

		let period = 0

		beforeEach(async () => {

				// creting token instance
				FrontierTokenInstance = await Standard20TokenMock.new(voterAccounts, totalTokenIssuance, {from: owner})
				// Creating Vault
				Vault = await VaultContract.new({from: owner})
				// Approving trasfer to fund Vault
				await FrontierTokenInstance.approve(Vault.address, totalTokenIssuance, {from: voterAccounts[0]})
				// Funding Vault
				await Vault.deposit(0, FrontierTokenInstance.address, voterAccounts[0], totalTokenIssuance, {from: voterAccounts[0]})

				await Vault.close(0, FrontierTokenInstance.address)
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

		it("Should calculate the correct amount", async()=>{
				let vaultBalance = await Vault.balance(0, FrontierTokenInstance.address)
				await Allowance.addEntity(entity1, "entity-1", entity1Allowance)
				await Allowance.addEntity(entity2, "entity-2", entity2Allowance)
				await Allowance.addEntity(entity3, "entity-3", entity3Allowance)
				const setAllowance = await Allowance.getEntityAllowance(entity1)
				await Balance.setBalancesForEntities([entity1,entity2,entity3], FrontierTokenInstance.address,{from: owner})
				const setBalance1 = await Balance.getBalance (entity1, FrontierTokenInstance.address)
				const setBalance2 = await Balance.getBalance (entity2, FrontierTokenInstance.address)
				const setBalance3 = await Balance.getBalance (entity3, FrontierTokenInstance.address)
				assert.equal(setBalance1,totalTokenIssuance*entity1Allowance/100,"Balance of entity"+1+"wrong")
				assert.equal(setBalance2,totalTokenIssuance*entity2Allowance/100,"Balance of entity"+2+"wrong")
				assert.equal(setBalance3,totalTokenIssuance*entity3Allowance/100,"Balance of entity"+3+"wrong")
		})
		
		it("Should return the correct balance after withdraw", async()=>{
				let vaultBalance = await Vault.balance(0, FrontierTokenInstance.address)
				await Allowance.addEntity(entity1, "entity-1", entity1Allowance)
				await Balance.setBalancesForEntities([entity1], FrontierTokenInstance.address,{from: owner})
				const initialBalance = await Balance.getBalance (entity1, FrontierTokenInstance.address)
				const withdrawAmount = 100
				await Balance.withdraw(entity1, FrontierTokenInstance.address, withdrawAmount)
				const afterBalance = await Balance.getBalance (entity1, FrontierTokenInstance.address)
				
				assert.equal(afterBalance,initialBalance-withdrawAmount,"Balance after withdrawal is wrong")
		})
		
		it("Should fail when withdrawing too much", async()=>{
				let vaultBalance = await Vault.balance(0, FrontierTokenInstance.address)
				await Allowance.addEntity(entity1, "entity-1", entity1Allowance)
				await Balance.setBalancesForEntities([entity1], FrontierTokenInstance.address,{from: owner})
				const initialBalance = await Balance.getBalance (entity1, FrontierTokenInstance.address)
				const withdrawAmount = initialBalance+1
				await assertRevert( Balance.withdraw(entity1, FrontierTokenInstance.address, withdrawAmount))	
		})

})
