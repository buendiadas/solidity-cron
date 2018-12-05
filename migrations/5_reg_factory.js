const config = require('../config')
const OwnedRegistryFactoryContract = artifacts.require('@frontier-token-research/role-registries/contracts/OwnedRegistryFactory')

module.exports = (deployer) => {
  if (config.proxyMigration) {
    deployer.deploy(OwnedRegistryFactoryContract)
  }
}
