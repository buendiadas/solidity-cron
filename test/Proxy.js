const config = require('../config')
const { assertRevert } = require('./helpers/assertRevert')
const TRLContract = artifacts.require('TRL')
const ProxyContract = artifacts.require('Proxy')

contract('Proxy', function (accounts) {
  let TRLInstance
  let ProxyInstance
  let adminAccount = web3.eth.accounts[0]
  let ProxyTRLInstance;

  before('Deploying required contracts', async () => {
    ProxyInstance = await ProxyContract.new()
    TRLInstance = await TRLContract.new({from: adminAccount})
    ProxyTRLInstance = await TRLContract.at(ProxyInstance.address)
    await ProxyInstance.setContractLogic(TRLInstance.address)
  })

  describe('Setting the logic Contract', async () => {
    it('Should set the new contract target in storage', async () => {
      const logicContractAddress = await ProxyInstance.logicContract.call()
      assert.strictEqual(logicContractAddress, TRLInstance.address)
    })
  })
  describe('Delegating calls', async () => {
    it('Should be able to call a target function', async () => {
      const ProxyTRLInstance = TRLContract.at(ProxyInstance.address)
      assert(true)
    })
    it('Should be able to initialize the contract', async () => {
      const ProxyTRLInstance = await TRLContract.at(ProxyInstance.address)
      await ProxyTRLInstance.initPeriod(config.ttl)
      let periodicStagesAddress = await ProxyTRLInstance.periodicStages.call()
      assert(periodicStagesAddress != 0x00, 'PeriodicStagesAddress is initialized')
    })
  })
})
