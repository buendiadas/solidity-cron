/* global artifacts contract web3 before beforeEach it assert */
const config = require('../../config')
const advanceToBlock = require('../helpers/advanceToBlock')
const { assertRevert } = require('../helpers/assertRevert')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const TRLContract = artifacts.require('TRL')
const PeriodicStageContract = artifacts.require('PeriodicStages')
const PeriodContract = artifacts.require('Period')
const VaultContract = artifacts.require('Vault')
const OwnedRegistryContract = artifacts.require('OwnedRegistryMock')

// Payments
const BankContract = artifacts.require('Bank')
const AllowanceContract = artifacts.require('Allowance')
const HelenaFeeContract = artifacts.require('helenaAgent')
const BasicSalaryEntityContract = artifacts.require('BasicSalaryEntity')

contract('BasicSalary', function (accounts) {
  let TRLInstance
  let FrontierTokenInstance
  let CandidateRegistryInstance
  let VoterRegistryInstance
  let PeriodicStagesInstance
  let Vault
  let adminAccount = web3.eth.accounts[0]
  let voterAccounts = web3.eth.accounts.slice(1, 4)
  let candidateAccounts = web3.eth.accounts.slice(5, 8)
  let PeriodInstance

  let Allowance
  let Balance
  const totalTokenIssuance = 100

  const receiver = candidateAccounts[1]
  const wrongReceiver = candidateAccounts[2]

  let period = 0

  let basicSalaryInstance
  const owner = web3.eth.accounts[0]

  before('Deploying required contracts', async () => {
    CandidateRegistryInstance = await OwnedRegistryContract.new(candidateAccounts, {from: adminAccount})
    VoterRegistryInstance = await OwnedRegistryContract.new(voterAccounts, {from: adminAccount})
  })
  beforeEach(async () => {
    FrontierTokenInstance = await Standard20TokenMock.new(voterAccounts, config.totalTokens, {from: adminAccount})
    Vault = await VaultContract.new({from: adminAccount})
    TRLInstance = await TRLContract.new({from: adminAccount})
    await TRLInstance.setToken(FrontierTokenInstance.address)
    await TRLInstance.setCandidateRegistry(CandidateRegistryInstance.address)
    await TRLInstance.setVoterRegistry(VoterRegistryInstance.address)
    await TRLInstance.setVault(Vault.address)
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
      { from: voterAccounts[0] })

    await Vault.close(0, FrontierTokenInstance.address)
    Allowance = await AllowanceContract.new()
    Balance = await BankContract.new(
      Allowance.address,
      Vault.address
      )
    basicSalaryInstance = await BasicSalaryEntityContract.new(
      Vault.address,
      Balance.address
      )
    await Allowance.addEntity(
      basicSalaryInstance.address,
      'Helena-fee',
      100,
      period
      )

    for (let candidate of candidateAccounts) {
      await basicSalaryInstance.addAllowedReceiver(candidate, FrontierTokenInstance.address, { from: owner })
    }

    await basicSalaryInstance.setCandidateRegistry(CandidateRegistryInstance.address)
    await Balance.setBalancesForEntities([basicSalaryInstance.address], FrontierTokenInstance.address, period)
    await Vault.setBankContractAddress(Balance.address, { from: owner })
  })

  describe('Should pass', async () => {
    it('Should make the payment to the Receiver', async () => {
      let receiverBalance = -1
      const numberOfCandidates = candidateAccounts.length
      const expectedBalance = Math.floor(totalTokenIssuance / numberOfCandidates)
      for (let candidate of candidateAccounts) {
        await basicSalaryInstance.collectPayment(
          candidate,
          FrontierTokenInstance.address,
          period
          )
        receiverBalance = await FrontierTokenInstance.balanceOf(candidate)
        console.log('Ac: ' + JSON.stringify(receiverBalance) + ' Ex: ' + expectedBalance)
        assert.equal(receiverBalance, expectedBalance)
      }
    })
  })
})
