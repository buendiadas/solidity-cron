const config = require('../config');
const OwnedRegistryFactory = artifacts.require('OwnedRegistryFactory')
const OwnedRegistryContract = artifacts.require('OwnedRegistry')
const Standard20TokenContract = artifacts.require('Standard20TokenMock')
const TRLContract = artifacts.require('TRL')
const voterAccounts = web3.eth.accounts.slice(1,4)
const candidateAccounts = web3.eth.accounts.slice(5,8)


const initializeRegistry = function(registry,inputAccounts){
    for (let i = 0; i < inputAccounts.length ; i++){
        registry.whiteList(inputAccounts[i]);
    }
}

module.exports = (deployer) => {
  deployer.then(async() => {
      const RegistryFactory= await OwnedRegistryFactory.deployed();
      const voterRegistryAddress = await RegistryFactory.newRegistry.call(config.voterLength)
      await initializeRegistry(OwnedRegistryContract.at(voterRegistryAddress), voterAccounts)
      const candidateRegistryAddress = await RegistryFactory.newRegistry.call(config.voterLength)
      await initializeRegistry(OwnedRegistryContract.at(candidateRegistryAddress), candidateAccounts)
      const FrontierToken = await Standard20TokenContract.deployed();
      await deployer.deploy(TRLContract,FrontierToken.address,candidateRegistryAddress,voterRegistryAddress,config.activeTime,config.claimTime,config.ttl)
  });
}
