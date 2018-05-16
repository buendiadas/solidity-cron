const OwnedRegistryFactoryContract = artifacts.require('OwnedRegistryFactory')

module.exports = (deployer) => {
  deployer.deploy(OwnedRegistryFactoryContract)
}
