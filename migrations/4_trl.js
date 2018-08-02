const config = require('../config')
const keccak256 = require('js-sha3').keccak256
const OwnedRegistryFactory = artifacts.require('OwnedRegistryFactory')
const OwnedRegistryContract = artifacts.require('OwnedRegistry')
const Standard20TokenContract = artifacts.require('Standard20TokenMock')
const options = {from: config.ownerAccount}
const TRLContract = artifacts.require('TRL')

// 0x7e5584d9b29f5e9a0c9cef80ded84cbac5b66bd6

module.exports = (deployer) => {
  deployer.then(async () => {
    const RegistryFactory = await OwnedRegistryFactory.deployed()
    console.log('1')
    await RegistryFactory.newRegistry(keccak256('voter'))
    console.log('2')
    await RegistryFactory.newRegistry(keccak256('candidate'))
    console.log('3')
    const candidateRegistryAddress = await RegistryFactory.getRegistry.call(keccak256('voter'))
    // const candidateRegistryAddress = '0x39e75964b446dc512578051338f960727e034b01'
    console.log('4')
    const voterRegistryAddress = await RegistryFactory.getRegistry.call(keccak256('candidate'))
    // const voterRegistryAddress = '0x5226b7904424d2a12055204b74a842558d525b38'
    console.log('5')
    const FrontierToken = await Standard20TokenContract.deployed()
    console.log('6')
    await deployer.deploy(TRLContract, FrontierToken.address, candidateRegistryAddress, voterRegistryAddress, config.ttl, config.activeTime, config.claimTime)
    console.log('7')
  })
}
