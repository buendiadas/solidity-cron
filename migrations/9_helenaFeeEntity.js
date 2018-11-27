/* global artifacts  */
const HelenaFeeEntityContract = artifacts.require('helenaAgent')
const VaultContract = artifacts.require('Vault')
const BankContract = artifacts.require('Bank')

module.exports = deployer => {
  deployer.then(async () => {
    const vaultInstance = await VaultContract.deployed()
    const bankInstance = await BankContract.deployed()
    await deployer.deploy(
      HelenaFeeEntityContract,
      vaultInstance.address,
      bankInstance.address
    )
  })
}
