const config = require('../config')
const advanceToBlock = require('./helpers/advanceToBlock')
const { assertRevert } = require('./helpers/assertRevert')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const TRLContract = artifacts.require('TRL')
const PeriodicStageContract = artifacts.require('PeriodicStages')
const PeriodContract = artifacts.require('Period')
const VaultContract = artifacts.require('Vault')
const SubscriptionContract = artifacts.require('Subscription')
const OwnedRegistryContract = artifacts.require('OwnedRegistryMock')

contract('TRL<Active>', function (accounts) {
  let TRLInstance
  let FrontierTokenInstance
  let CandidateRegistryInstance
  let VoterRegistryInstance
  let PeriodicStagesInstance
  let SubscriptionInstance
  let ScoringInstance
  let Vault
  let PeriodInstance
  let adminAccount = web3.eth.accounts[0]
  let subscriptionAmount = 100;
  let minimumSubscription = 40;
  let maximumSubscription = 300;
  let voterAccounts = web3.eth.accounts.slice(1, 4)
  let candidateAccounts = web3.eth.accounts.slice(5, 8)

  before('Deploying required contracts', async () => {
    CandidateRegistryInstance = await OwnedRegistryContract.new(candidateAccounts, {from: adminAccount})
    VoterRegistryInstance = await OwnedRegistryContract.new(voterAccounts, {from: adminAccount})
    Vault = await VaultContract.new({from: adminAccount})
    FrontierTokenInstance = await Standard20TokenMock.new(voterAccounts, config.totalTokens, {from: adminAccount})
    TRLInstance = await TRLContract.new({from: adminAccount})
    await TRLInstance.setToken(FrontierTokenInstance.address)
    await TRLInstance.setCandidateRegistry(CandidateRegistryInstance.address)
    await TRLInstance.setVoterRegistry(VoterRegistryInstance.address)
    await TRLInstance.setVault(Vault.address)
    await TRLInstance.initPeriod(config.ttl)
    await TRLInstance.initStages(config.ttl, 0)
  })
  beforeEach(async () => {
    SubscriptionInstance = await SubscriptionContract.new(TRLInstance.address)
    await TRLInstance.setSubscriptionAccount(SubscriptionInstance.address);
    let periodicStagesAddress = await TRLInstance.periodicStages.call()
    PeriodicStagesInstance = await PeriodicStageContract.at(periodicStagesAddress)
    let periodAddress = await PeriodicStagesInstance.period.call()
    PeriodInstance = await PeriodContract.at(periodAddress)
  })
  describe('Adding a subscription', async () => {
    it('Should set a subscription as active when a voter requires it', async () => {
      await FrontierTokenInstance.approve(SubscriptionInstance.address, 12 * subscriptionAmount, {from: voterAccounts[0], gas: 4712388})
      await SubscriptionInstance.subscribe(subscriptionAmount, {from: voterAccounts[0]})
      const storedSubscription = await SubscriptionInstance.subscriptions.call(voterAccounts[0])
      assert.strictEqual(true, storedSubscription[0])
    })
    it('Should set a subscription amount when a voter requires it', async () => {
      await FrontierTokenInstance.approve(SubscriptionInstance.address, 12 * subscriptionAmount, {from: voterAccounts[0], gas: 4712388})
      await SubscriptionInstance.subscribe(subscriptionAmount, {from: voterAccounts[0]})
      const storedSubscription = await SubscriptionInstance.subscriptions.call(voterAccounts[0])
      assert.strictEqual(subscriptionAmount, storedSubscription[1].toNumber())
    })
    it('Should set the next epoch to execute the subscription as the current height', async () => {
      await FrontierTokenInstance.approve(SubscriptionInstance.address, 12 * subscriptionAmount, {from: voterAccounts[0], gas: 4712388})
      await SubscriptionInstance.subscribe(subscriptionAmount, {from: voterAccounts[0]})
      const storedSubscription = await SubscriptionInstance.subscriptions.call(voterAccounts[0])
      const height = TRLInstance.height.call();
      assert.strictEqual(1, storedSubscription[2].toNumber())
    })
    it('Should throw when the subscription is less than the minimum amount', async () => {
      await FrontierTokenInstance.approve(SubscriptionInstance.address, 12 * subscriptionAmount, {from: voterAccounts[0], gas: 4712388})
      await SubscriptionInstance.setMin(minimumSubscription);
      await assertRevert(SubscriptionInstance.subscribe(minimumSubscription -1, {from:voterAccounts[0]}))
    })
    it('Should throw when the subscription is more than the maximum amount', async () => {
      await FrontierTokenInstance.approve(SubscriptionInstance.address, 12 * subscriptionAmount, {from: voterAccounts[0], gas: 4712388})
      await SubscriptionInstance.setMax(maximumSubscription);
      await assertRevert(SubscriptionInstance.subscribe(maximumSubscription +1, {from:voterAccounts[0]}))
    })
  })
  describe('Executing a subscription', async () => {
    it('Should be able to execute a subscription on a already subscribed user', async () => {
      await FrontierTokenInstance.approve(SubscriptionInstance.address, 12 * subscriptionAmount, {from: voterAccounts[0], gas: 4712388})
      await SubscriptionInstance.subscribe(subscriptionAmount, {from: voterAccounts[0], gas: 4712388})
      const periodsToAdvance = 1
      await advanceToBlock.advanceToBlock(web3.eth.blockNumber + 1 * config.ttl)
      await SubscriptionInstance.execute(voterAccounts[0], {gas: 4712388})
      assert(true);
    })
    it('Should revert if a subscription is tried to be executed twice in the same period', async () => {
      await FrontierTokenInstance.approve(SubscriptionInstance.address, 12 * subscriptionAmount, {from: voterAccounts[0], gas: 4712388})
      await SubscriptionInstance.subscribe(subscriptionAmount, {from: voterAccounts[0], gas: 4712388}) 
      await assertRevert(SubscriptionInstance.execute(voterAccounts[0], {gas: 4712388}))
    })
  })

})

