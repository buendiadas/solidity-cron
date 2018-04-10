const config = require('../config');
const Standard20TokenContract = artifacts.require('Standard20TokenMock')
const OwnedRegistryContract = artifacts.require('OwnedRegistryMock')
const TRLContract = artifacts.require('TRL')

module.exports = function(deployer) {
  deployer.then(async () => {
      let voterAccounts = await web3.eth.accounts.slice(1,4)
      let candidateAccounts = await web3.eth.accounts.slice(5,8)
      let candidateRegistry = await deployer.deploy(OwnedRegistryContract,candidateAccounts,config.candidateLength)
      let voterRegistry = await deployer.deploy(OwnedRegistryContract,voterAccounts,config.voterLength)
      let token = await deployer.deploy(Standard20TokenContract,web3.eth.accounts,config.initialBalance)
      deployer.deploy(TRLContract,token,candidateRegistry,voterRegistry,config.activeTime,config.claimTime,config.ttl)
  })
}
