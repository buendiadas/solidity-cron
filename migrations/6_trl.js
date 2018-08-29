const config = require('../config')
const keccak256 = require('js-sha3').keccak256
const Standard20TokenContract = artifacts.require('Standard20TokenMock')
const ProxyContract = artifacts.require('Proxy')
const PeriodicStageContract = artifacts.require('PeriodicStages')
const options = {from: config.ownerAccount}
const TRLContract = artifacts.require('TRL')
const OwnedRegistryFactoryContract = artifacts.require('@frontier-token-research/role-registries/contracts/OwnedRegistryFactory')

module.exports = (deployer) => {
  deployer.then(async () => {
    let ProxyInstance = await ProxyContract.deployed()
    let TRLInstance = await deployer.deploy(TRLContract)
    await ProxyInstance.setContractLogic(TRLInstance.address)

    const WINDOW_SIZE = config.reputationWindowSize
    const linWeightsSmaller = config.reputationWeights

    if (config.proxyMigration) {
      const RegistryFactory = await OwnedRegistryFactoryContract.deployed()
      const voterRegistryAddress = await RegistryFactory.getRegistry.call(keccak256('voter'))
      const candidateRegistryAddress = await RegistryFactory.getRegistry.call(keccak256('candidate'))
      const FrontierToken = await Standard20TokenContract.deployed()
      const ProxyTRL = await TRLContract.at(ProxyInstance.address)
      await ProxyTRL.setToken(FrontierToken.address)
      await ProxyTRL.setCandidateRegistry(candidateRegistryAddress)
      await ProxyTRL.setVoterRegistry(voterRegistryAddress)
      await ProxyTRL.initPeriod(config.ttl)
      await ProxyTRL.initStages(config.activeTime, config.claimTime)
      await ProxyTRL.setWindowSize(WINDOW_SIZE)
      await ProxyTRL.setReputationLinWeights(linWeightsSmaller)
    }
  })
}
