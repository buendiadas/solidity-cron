const config = require('../config')
const keccak256 = require('js-sha3').keccak256
const PeriodContract = artifacts.require('Daily');
const Standard20TokenContract = artifacts.require('Standard20TokenMock')
const ProxyContract = artifacts.require('Proxy')
const VaultContract = artifacts.require('Vault')
const options = {from: config.ownerAccount}
const TRLContract = artifacts.require('TRL')
const OwnedRegistryFactoryContract = artifacts.require('@frontier-token-research/role-registries/contracts/OwnedRegistryFactory')
const fs = require('fs')

module.exports = (deployer) => {
  deployer.then(async () => {
    let ProxyInstance = await ProxyContract.deployed()
    let TRLInstance = await deployer.deploy(TRLContract)
    await ProxyInstance.setContractLogic(TRLInstance.address)

    const WINDOW_SIZE = config.reputationWindowSize
    const linWeightsSmaller = config.reputationWeights

    if (config.proxyMigration) {
      const RegistryFactory = await OwnedRegistryFactoryContract.deployed()
      const PeriodInstance = await PeriodContract.deployed()
      const voterRegistryAddress = await RegistryFactory.getRegistry.call(keccak256('voter'))
      const candidateRegistryAddress = await RegistryFactory.getRegistry.call(keccak256('candidate'))
      const FrontierToken = await Standard20TokenContract.deployed()
      const Vault = await VaultContract.deployed()
      const ProxyTRL = await TRLContract.at(ProxyInstance.address)
      await ProxyTRL.setToken(FrontierToken.address)
      await ProxyTRL.setCandidateRegistry(candidateRegistryAddress)
      await ProxyTRL.setVoterRegistry(voterRegistryAddress)
      await ProxyTRL.setVault(Vault.address)
      await ProxyTRL.setPeriod(PeriodInstance.address)
      //await ProxyTRL.setWindowSize(WINDOW_SIZE)
      //await ProxyTRL.setReputationLinWeights(linWeightsSmaller)

      // storing the contract address
      // added this comment to trigger a release
      if (process.env.INTEGRATION_TEST === '1') {
        let proxyAddress = await ProxyInstance.address
        let proxyAddressObj = {address: proxyAddress}
        proxyAddressObj = JSON.stringify(proxyAddressObj)
        const addressPath = process.env.PROXY_ADDR_PATH

        await fs.writeFileSync(addressPath, proxyAddressObj)
      }
    }
  })
}
