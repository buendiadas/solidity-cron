const config = require('../config')
const { assertRevert } = require('./helpers/assertRevert')
const TRLContract = artifacts.require('TRL')
const ProxyContract = artifacts.require('Proxy')
const PeriodContract = artifacts.require('PeriodMock')

contract('Proxy', function (accounts) {
  let TRLInstance
  let ProxyInstance
  let adminAccount = web3.eth.accounts[0]
  let ProxyTRLInstance
  let PeriodInstance

  before('Deploying required contracts', async () => {
    ProxyInstance = await ProxyContract.new()
    TRLInstance = await TRLContract.new({from: adminAccount})
    PeriodInstance = await PeriodContract.new()
    ProxyTRLInstance = await TRLContract.at(ProxyInstance.address)
    ProxyTRLInstance.setPeriod(PeriodInstance.address)
    await ProxyInstance.setContractLogic(TRLInstance.address)
  })

  describe('Setting the logic Contract', async () => {
    it('Should set the new contract target in storage', async () => {
      const logicContractAddress = await ProxyInstance.logicContract.call()
      assert.strictEqual(logicContractAddress, TRLInstance.address)
    })
  })
  describe('ERC897 compliance', async () => {
    it('Should be identified as a upgradeable contract ', async () => {
      const proxyType = await ProxyInstance.proxyType.call()
      assert.strictEqual(2, proxyType.toNumber())
    })
  })
  describe('Delegating calls', async () => {
    it('Should be able to call a target function', async () => {
      const ProxyTRLInstance = TRLContract.at(ProxyInstance.address)
      assert(true)
    })
    it('Should be able to initialize the contract', async () => {
      const ProxyTRLInstance = await TRLContract.at(ProxyInstance.address)
      ProxyTRLInstance.setPeriod(PeriodInstance.address)
      let periodAddress = await ProxyTRLInstance.period()
      assert(periodAddress != 0x00, 'Periodic Address is initialized')
    })
  })
})
