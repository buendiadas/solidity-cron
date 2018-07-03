const config = require('../config')
const keccak256 = require('js-sha3').keccak256
const OwnedRegistryFactory = artifacts.require('OwnedRegistryFactory')
const OwnedRegistryContract = artifacts.require('OwnedRegistry')
const Standard20TokenContract = artifacts.require('Standard20TokenMock')
const options = {from: config.ownerAccount}
const TRLContract = artifacts.require('TRL')

module.exports = (deployer) => {
  deployer.then(async () => {
    const RegistryFactory = await OwnedRegistryFactory.deployed()
    await RegistryFactory.newRegistry(keccak256('voter'))
    await RegistryFactory.newRegistry(keccak256('candidate'))
    const candidateRegistryAddress = await RegistryFactory.getRegistry.call(keccak256('voter'))
    const voterRegistryAddress = await RegistryFactory.getRegistry.call(keccak256('candidate'))
    const FrontierToken = await Standard20TokenContract.deployed()
    await deployer.deploy(TRLContract, FrontierToken.address, candidateRegistryAddress, voterRegistryAddress, config.ttl, config.activeTime, config.claimTime)
  })
}
