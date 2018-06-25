const OwnedRegistryFactoryContract = artifacts.require('@frontier-token-research/role-registries/contracts/OwnedRegistryFactory')

module.exports = (deployer) => {
  deployer.deploy(OwnedRegistryFactoryContract)
}
