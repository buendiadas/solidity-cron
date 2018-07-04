const config = require('../config')
const Standard20TokenContract = artifacts.require('Standard20TokenMock')

module.exports = (deployer) => {
  deployer.deploy(Standard20TokenContract, config.voterAccounts, config.initialBalance)
}
