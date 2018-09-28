const config = require('../config')
const VaultContract = artifacts.require('Vault')

module.exports = (deployer) => {
  if (config.proxyMigration) {
    deployer.deploy(VaultContract)
  }
}
