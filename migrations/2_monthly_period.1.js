const MonthlyPeriod = artifacts.require('Monthly.sol')
const DateTime = artifacts.require('DateTime.sol')

module.exports = function (deployer) {
  deployer.deploy(DateTime).then(() => {
    deployer.deploy(MonthlyPeriod)
  })
  deployer.link(DateTime, MonthlyPeriod)
}
