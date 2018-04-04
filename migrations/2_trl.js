const config = require('../config');
const Standard20TokenContract = artifacts.require('Standard20TokenMock')
const OwnedRegistryContract = artifacts.require('OwnedRegistry')
const TRLContract = artifacts.require('TRL')

module.exports = function(deployer) {
  deployer.then(async () => {
      let candidateRegistry = await deployer.deploy(OwnedRegistryContract, config.candidate_length)
      let voterRegistry = await deployer.deploy(OwnedRegistryContract, config.voter_length)
      let token = await deployer.deploy(Standard20TokenContract,web3.eth.accounts[0],web3.eth.accounts[1], config.initial_balance)
      deployer.deploy(TRLContract,token,candidateRegistry,voterRegistry, config.ttl)
  })
}
