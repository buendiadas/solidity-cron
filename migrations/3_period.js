const config = require('../config')
const DateTime = artifacts.require('DateTime');
const PeriodContract = artifacts.require('Daily');

module.exports = (deployer) => {
  deployer.then(async () => {
  await deployer.deploy(DateTime)
  await deployer.deploy(PeriodContract)
  await deployer.link(DateTime, PeriodContract)
  })
}
