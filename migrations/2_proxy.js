const config = require('../config')
const Proxy = artifacts.require('Proxy')

module.exports = (deployer) => {
  if (config.proxyMigration) {
    deployer.deploy(Proxy)
  }
}
