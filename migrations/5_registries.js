/* global artifacts  */
const config = require('../config')
const Standard20TokenContract = artifacts.require('Standard20TokenMock')
const keccak256 = require('js-sha3').keccak256
const OwnedRegistryFactoryContract = artifacts.require('@frontier-token-research/role-registries/contracts/OwnedRegistryFactory')

module.exports = (deployer) => {
  deployer.then(async () => {
    if (config.proxyMigration) {
      const RegistryFactory = await OwnedRegistryFactoryContract.deployed()
      await RegistryFactory.newRegistry(keccak256('voter'))
      await RegistryFactory.newRegistry(keccak256('candidate'))
    }
  })
}
