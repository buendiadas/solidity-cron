const config = require('../config')
const Subscription = artifacts.require('Subscription')
const ProxyContract = artifacts.require('Proxy')
const TRLContract = artifacts.require('TRL')

module.exports = (deployer) => {
  deployer.then(async () => {
    if (config.proxyMigration) {
      let ProxyInstance = await ProxyContract.deployed()
      let ProxyTRL = TRLContract.at(ProxyInstance.address)
      let subscription = await deployer.deploy(Subscription, ProxyTRL.address)
       await ProxyTRL.setSubscriptionAccount(subscription.address)
    }
  })
}
