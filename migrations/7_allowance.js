/* global artifacts  */
const config = require('../config')
const AllowanceContract = artifacts.require('Allowance')

module.exports = (deployer) => {
  if (config.proxyMigration) {
    deployer.deploy(AllowanceContract)
  }
}
