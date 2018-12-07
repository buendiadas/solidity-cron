const config = require('../config')
const DateTime = artifacts.require('DateTime');
const PeriodContract = artifacts.require('Daily');

module.exports = function (deployer) {
  deployer.deploy(DateTime).then(() => {
    deployer.deploy(PeriodContract)
  })
  deployer.link(DateTime, PeriodContract)
}

