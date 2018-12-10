/* global artifacts contract web3 before beforeEach it assert */
const config = require('../../config')
const advanceToBlock = require('../helpers/advanceToBlock')
const { assertRevert } = require('../helpers/assertRevert')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
// const TRLContract = artifacts.require('TRL')
const TRLContract = artifacts.require('TRLMock')
const PeriodicStageContract = artifacts.require('PeriodicStages')
const PeriodContract = artifacts.require('Period')
const VaultContract = artifacts.require('Vault')
const OwnedRegistryContract = artifacts.require('OwnedRegistryMock')

// Payments
const BankContract = artifacts.require('Bank')
const AllowanceContract = artifacts.require('Allowance')
const HelenaFeeContract = artifacts.require('helenaAgent')
const MainSalaryEntityContract = artifacts.require('MainSalaryEntity')

// When DEBUG_MODE=true, the logs are printed.

const DEBUG_MODE = false

contract('MainSalaryEntity', function (accounts) {
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

  const percentageResolution = config.percentageResolution
  const entityPercentage = 100
  const entityPercentageMultiplied = entityPercentage * percentageResolution
  const receiver = candidateAccounts[1]
  const wrongReceiver = candidateAccounts[2]

  let totalVotesBought = 100

  let period = 0

  let mainSalaryInstance
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
    await TRLInstance.initPeriod(config.ttl)
    await TRLInstance.initStages(config.activeTime, config.claimTime)
    let periodicStagesAddress = await TRLInstance.periodicStages.call()
    PeriodicStagesInstance = await PeriodicStageContract.at(periodicStagesAddress)
    let periodAddress = await PeriodicStagesInstance.period.call()
    PeriodInstance = await PeriodContract.at(periodAddress)

    // Aproving and buying votes
    await FrontierTokenInstance.approve(TRLInstance.address, totalVotesBought, {from: voterAccounts[0]})
    await TRLInstance.buyTokenVotes(totalVotesBought, { from: voterAccounts[0] })

    await FrontierTokenInstance.approve(TRLInstance.address, totalVotesBought, {from: voterAccounts[1]})
    await TRLInstance.buyTokenVotes(totalVotesBought, { from: voterAccounts[1] })

    await FrontierTokenInstance.approve(TRLInstance.address, totalVotesBought, {from: voterAccounts[2]})
    await TRLInstance.buyTokenVotes(totalVotesBought, { from: voterAccounts[2] })

    printLogs(String('ADMIN: ' + await FrontierTokenInstance.balanceOf(adminAccount)))
    printLogs(String('Acc1: ' + await FrontierTokenInstance.balanceOf(voterAccounts[0])))

    // Approving trasfer to fund Vault
    await FrontierTokenInstance.approve(Vault.address, totalTokenIssuance, { from: voterAccounts[0] })

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
    mainSalaryInstance = await MainSalaryEntityContract.new(
      Vault.address,
      Balance.address,
      TRLInstance.address
      )
    await Allowance.addEntity(
      mainSalaryInstance.address,
      'Helena-fee',
      entityPercentageMultiplied,
      period
      )

    await mainSalaryInstance.setCandidateRegistry(CandidateRegistryInstance.address)
    await Balance.setBalancesForEntities([mainSalaryInstance.address], FrontierTokenInstance.address, period)
    await Vault.setBankContractAddress(Balance.address, { from: owner })
  })

  describe('Main Salary', async () => {
    it('Should count the total number of votes cast', async () => {
      let userVotes

      const voter1VotesCast = totalVotesBought
      const voter2VotesCast = totalVotesBought
      // Voting and  checking the user received the votes
      await TRLInstance.vote(candidateAccounts[0], voter1VotesCast, { from: voterAccounts[0] })
      userVotes = await TRLInstance.getUserVotes(0, candidateAccounts[0])
      assert.equal(userVotes, voter1VotesCast)

      await TRLInstance.vote(candidateAccounts[1], voter2VotesCast, { from: voterAccounts[1] })
      userVotes = await TRLInstance.getUserVotes(0, candidateAccounts[1])
      assert.equal(userVotes, voter2VotesCast)

      const expectedVotesCast = voter1VotesCast + voter2VotesCast
      await TRLInstance.mock_next()
      const actualVotesCast = await TRLInstance.getEpochTotalVotes(0)

      assert.equal(actualVotesCast, expectedVotesCast)
    })

    it('Transfer the correct to 2 users', async () => {
      const VaultBalance = await FrontierTokenInstance.balanceOf(Vault.address)
      let userBalance = await FrontierTokenInstance.balanceOf(candidateAccounts[1])
      printLogs(String('InitBal: ' + userBalance))

      const voter1VotesCast = totalVotesBought
      // Voting and  checking the user received the votes
      await TRLInstance.vote(candidateAccounts[0], voter1VotesCast, { from: voterAccounts[0] })
      await TRLInstance.vote(candidateAccounts[1], voter1VotesCast, { from: voterAccounts[1] })

      await TRLInstance.mock_next()

      printLogs(String('H1: ' + await CandidateRegistryInstance.getHeight()))
      await CandidateRegistryInstance.debug_forceUpdate()
      await CandidateRegistryInstance.next()
      await CandidateRegistryInstance.debug_forceUpdate()
      await CandidateRegistryInstance.next()
      await CandidateRegistryInstance.debug_forceUpdate()
      printLogs(String('H2: ' + await CandidateRegistryInstance.getHeight()))

      printLogs(String('0 --> ' + await CandidateRegistryInstance.debug_getArchive(0)))
      printLogs(String('1 --> ' + await CandidateRegistryInstance.debug_getArchive(1)))

      printLogs(String('White? --> ' + JSON.stringify(await CandidateRegistryInstance.wasWhitelisted(candidateAccounts[0], 0))))
      printLogs(String('Account 1: ' + candidateAccounts[0]))

      /*
        The problem in on the collectPayment function, in the
        require(candidateRegistry.wasWhitelisted(_destination,_epoch));
        It probably has something to do with the archive. Some debug ideas are:
          - check that the period in the candidate registry is actually moving
          - use the registry debug functions to see if the user is being whitelisted
              - Maybe the initial whitelisting function did not even work?

          - TODO: Get all height() requests from IPeriod. Mock IPeriod to include the nextPeriod() function.
          - TODO: Make the pure function to calculate the absolute number of tokens based on the number of votes.

      */

      printLogs(String(' entityBalance: ' + await Balance.getStartingBalance(mainSalaryInstance.address, FrontierTokenInstance.address, 0)))
      printLogs(String(' _userVotes: ' + await TRLInstance.getUserVotes(0, candidateAccounts[0])))
      printLogs(String(' _totalVotes: ' + await TRLInstance.getEpochTotalVotes(0)))

      await mainSalaryInstance.collectPayment(candidateAccounts[0], FrontierTokenInstance.address, 0)
      await mainSalaryInstance.collectPayment(candidateAccounts[1], FrontierTokenInstance.address, 0)

      const finalBalance1 = await FrontierTokenInstance.balanceOf(candidateAccounts[0])
      const finalBalance2 = await FrontierTokenInstance.balanceOf(candidateAccounts[1])

      assert.equal(finalBalance1, parseInt((userBalance + VaultBalance) / 2))
      assert.equal(finalBalance2, parseInt((userBalance + VaultBalance) / 2))
    })

    it('Should fail when collecting payment from current period', async () => {
      const VaultBalance = await FrontierTokenInstance.balanceOf(Vault.address)
      let userBalance = await FrontierTokenInstance.balanceOf(candidateAccounts[1])
      printLogs(String('InitBal: ' + userBalance))

      const voter1VotesCast = totalVotesBought
      // Voting and  checking the user received the votes
      await TRLInstance.vote(candidateAccounts[0], voter1VotesCast, { from: voterAccounts[0] })

      await assertRevert(mainSalaryInstance.collectPayment(candidateAccounts[0], FrontierTokenInstance.address, 0))
    })

    it('Should fail when collecting payment past the period limit (12 periods)', async () => {
      const VaultBalance = await FrontierTokenInstance.balanceOf(Vault.address)
      let userBalance = await FrontierTokenInstance.balanceOf(candidateAccounts[1])
      printLogs(String('InitBal: ' + userBalance))

      const voter1VotesCast = totalVotesBought
      // Voting and  checking the user received the votes
      await TRLInstance.vote(candidateAccounts[0], voter1VotesCast, { from: voterAccounts[0] })

      const periodsToAdvance = 12
      for (let i = 0; i < periodsToAdvance; i++) {
        await TRLInstance.mock_next()
      }

      await assertRevert(mainSalaryInstance.collectPayment(candidateAccounts[0], FrontierTokenInstance.address, 0))
    })

    it('Should round to the floor of the number', async () => {
      let userBalance = await FrontierTokenInstance.balanceOf(candidateAccounts[1])

      const voter1VotesCast = totalVotesBought
      // Voting and  checking the user received the votes
      await TRLInstance.vote(candidateAccounts[0], voter1VotesCast, { from: voterAccounts[0] })

      await CandidateRegistryInstance.debug_forceUpdate()
      await CandidateRegistryInstance.next()
      await CandidateRegistryInstance.debug_forceUpdate()
      await CandidateRegistryInstance.next()
      await CandidateRegistryInstance.debug_forceUpdate()

      const invalidUser = adminAccount

      await assertRevert(mainSalaryInstance.collectPayment(invalidUser, FrontierTokenInstance.address, 0))
    })

    it('Transfer the correct to 2 users', async () => {
      const VaultBalance = await FrontierTokenInstance.balanceOf(Vault.address)
      let userBalance = await FrontierTokenInstance.balanceOf(candidateAccounts[1])
      printLogs(String('InitBal: ' + userBalance))

      const voter1VotesCast = totalVotesBought
      // Voting and  checking the user received the votes
      await TRLInstance.vote(candidateAccounts[0], 40, { from: voterAccounts[0] })
      await TRLInstance.vote(candidateAccounts[1], 41, { from: voterAccounts[1] })

      await TRLInstance.mock_next()

      printLogs(String('H1: ' + await CandidateRegistryInstance.getHeight()))
      await CandidateRegistryInstance.debug_forceUpdate()
      await CandidateRegistryInstance.next()
      await CandidateRegistryInstance.debug_forceUpdate()
      await CandidateRegistryInstance.next()
      await CandidateRegistryInstance.debug_forceUpdate()
      printLogs(String('H2: ' + await CandidateRegistryInstance.getHeight()))

      printLogs(String('0 --> ' + await CandidateRegistryInstance.debug_getArchive(0)))
      printLogs(String('1 --> ' + await CandidateRegistryInstance.debug_getArchive(1)))

      printLogs(String('White? --> ' + JSON.stringify(await CandidateRegistryInstance.wasWhitelisted(candidateAccounts[0], 0))))
      printLogs(String('Account 1: ' + candidateAccounts[0]))

      /*
        The problem in on the collectPayment function, in the
        require(candidateRegistry.wasWhitelisted(_destination,_epoch));
        It probably has something to do with the archive. Some debug ideas are:
          - check that the period in the candidate registry is actually moving
          - use the registry debug functions to see if the user is being whitelisted
              - Maybe the initial whitelisting function did not even work?

          - TODO: Get all height() requests from IPeriod. Mock IPeriod to include the nextPeriod() function.
          - TODO: Make the pure function to calculate the absolute number of tokens based on the number of votes.

      */

      printLogs(String(' entityBalance: ' + await Balance.getStartingBalance(mainSalaryInstance.address, FrontierTokenInstance.address, 0)))
      printLogs(String(' _userVotes: ' + await TRLInstance.getUserVotes(0, candidateAccounts[0])))
      printLogs(String(' _totalVotes: ' + await TRLInstance.getEpochTotalVotes(0)))

      await mainSalaryInstance.collectPayment(candidateAccounts[0], FrontierTokenInstance.address, 0)
      await mainSalaryInstance.collectPayment(candidateAccounts[1], FrontierTokenInstance.address, 0)

      const finalBalance1 = parseInt(await FrontierTokenInstance.balanceOf(candidateAccounts[0]))
      const finalBalance2 = parseInt(await FrontierTokenInstance.balanceOf(candidateAccounts[1]))
      // The sum of distributed tokens can not vary by more than 1 token per user
      const diff = VaultBalance - (finalBalance1 + finalBalance2)

      const passes = (diff <= 2) && (diff >= 0)

      printLogs(String('Diff: ' + diff))
      printLogs(String('Passes: ' + passes))

      assert.equal(passes, true)
    })
  })
  describe('Random Votes', async () => {
    for (let i = 0; i < 5; i++) {
      it('#' + i, async () => {
        const VaultBalance = await FrontierTokenInstance.balanceOf(Vault.address)
        let userBalance = await FrontierTokenInstance.balanceOf(candidateAccounts[1])

        const votes = getRandomVotes(totalVotesBought)
        // Voting and  checking the user received the votes
        await TRLInstance.vote(candidateAccounts[0], votes[0], { from: voterAccounts[0] })
        await TRLInstance.vote(candidateAccounts[1], votes[1], { from: voterAccounts[1] })

        await TRLInstance.mock_next()
        await CandidateRegistryInstance.debug_forceUpdate()
        await CandidateRegistryInstance.next()
        await CandidateRegistryInstance.debug_forceUpdate()
        await CandidateRegistryInstance.next()
        await CandidateRegistryInstance.debug_forceUpdate()

        await mainSalaryInstance.collectPayment(candidateAccounts[0], FrontierTokenInstance.address, 0)
        await mainSalaryInstance.collectPayment(candidateAccounts[1], FrontierTokenInstance.address, 0)

        const finalBalance1 = parseInt(await FrontierTokenInstance.balanceOf(candidateAccounts[0]))
        const finalBalance2 = parseInt(await FrontierTokenInstance.balanceOf(candidateAccounts[1]))
        // The sum of distributed tokens can not vary by more than 1 token per user
        const diff = VaultBalance - (finalBalance1 + finalBalance2)

        printLogs(String('DIFF: ' + diff))

        const passes = (diff <= 2) && (diff >= 0)

        assert.equal(passes, true)
      })
    }
  })
})

function getRandomVotes (upperLimit) {
  while (1) {
    let a = Math.floor((Math.random() * upperLimit) + 1)
    let b = Math.floor((Math.random() * upperLimit) + 1)

    return [a, b]
  }
}

function printLogs () {
  if (DEBUG_MODE) {
    for (let i = 0; i < arguments.length; i++) {
      console.log(arguments[i])
    }
  }
}
