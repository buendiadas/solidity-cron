const YearlyPeriod = artifacts.require('Yearly.sol')
const DateTime = artifacts.require('DateTime.sol')

module.exports = function (deployer) {
  deployer.deploy(DateTime).then(() => {
    deployer.deploy(YearlyPeriod)
  })
  deployer.link(DateTime, YearlyPeriod)
}
