/* global artifacts  */
const VaultContract = artifacts.require('Vault')
const BankContract = artifacts.require('Bank')
const AllowanceContract = artifacts.require('Allowance')

module.exports = deployer => {
  deployer.then(async () => {
    const vaultInstance = await VaultContract.deployed()
    const allowanceInstance = await AllowanceContract.deployed()
    await deployer.deploy(
      BankContract,
      allowanceInstance.address,
      vaultInstance.address
    )
  })
}
