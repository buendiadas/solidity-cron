const Mock = artifacts.require('DateTimeMock.sol')
const DateTime = artifacts.require('DateTime.sol')

module.exports = function (deployer) {
  deployer.deploy(DateTime).then(() => {
    deployer.deploy(Mock)
  })
  deployer.link(DateTime, Mock)
}
