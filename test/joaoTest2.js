const config = require('../config')
const advanceToBlock = require('./helpers/advanceToBlock')
const { assertRevert } = require('./helpers/assertRevert')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const TRLContract = artifacts.require('TRL')
const PeriodicStageContract = artifacts.require('PeriodicStages')
const PeriodContract = artifacts.require('Period')
const OwnedRegistryContract = artifacts.require('OwnedRegistryMock')
const OwnedRegistryFactory = artifacts.require('OwnedRegistryFactory')
const keccak256 = require('js-sha3').keccak256
const EthJs = require('ethjs')
const truffleConfig = require('../truffle.js')

console.log('Provider:' + truffleConfig.networks.rinkeby_infura.provider())

contract('TRL22222', function (accounts) {
  // const rinkebyDeployedAddress = TRLContract.networks['4'].address

  before('Deploying required contracts', async () => {
    /*
  Network: rinkeby_frontier (id: 4)
  Migrations: 0x09e35f20a2a4762f316c790e7880a7150b52dffb
  OwnedRegistryFactory: 0xdcdb3492e3209d20e218de5ad24d62c7c8b903c0
  Standard20TokenMock: 0x8ddebf99ff9180197d9a36a8d0672eb7587d44d6
  TRL: 0x7e5584d9b29f5e9a0c9cef80ded84cbac5b66bd6
    */
    const eth = new EthJs(truffleConfig.networks.development2.provider())

    let OwnedRegistryFactoryContract = await eth.contract(OwnedRegistryFactory.abi)
    let FrontierTokenInstanceABI = await eth.contract(Standard20TokenMock.abi)
    let TRLInstanceABI = await eth.contract(TRLContract.abi)

    // let OwnedRegistryFactoryInstance = await OwnedRegistryFactory.deployed()
    let OwnedRegistryFactoryInstance = await OwnedRegistryFactoryContract.at('0xdcdb3492e3209d20e218de5ad24d62c7c8b903c0')
    let FrontierTokenInstance = await FrontierTokenInstanceABI.at('0x8ddebf99ff9180197d9a36a8d0672eb7587d44d6')
    let TRLInstance = await TRLInstanceABI.at('0x7e5584d9b29f5e9a0c9cef80ded84cbac5b66bd6')

    console.log('1')
    let periodicStagesAddress = await TRLInstance.periodicStages.call()
    console.log('2')
    const candidateRegistryAddress = await OwnedRegistryFactoryInstance.getRegistry.call(keccak256('voter'))

    // const balance = await FrontierTokenInstance.balanceOf.call(eth.accounts[0])
    // console.log('PPP' + JSON.stringify(balance))
    // let voterRegistryAddress = await OwnedRegistryFactoryInstance.getRegistry.call(keccak256('candidate'))
  })

  describe('Testing stuff', async () => {
    it('Hello World', async () => {
      assert.strictEqual(1, 1)
    })
    it('Testnet contract', async () => {
      // let deployedTRLContract = await TRLContract.at(rinkebyDeployedAddress)
      let deployedTRLContract = await TRLContract.deployed()
      // console.log(deployedTRLContract)
      assert.strictEqual(1, 1)
    })
  })
})
