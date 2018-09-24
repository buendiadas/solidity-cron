const FactoryContract = artifacts.require('OwnedRegistryFactory')
const config = require('../config')
const keccak256 = require('js-sha3').keccak256
const OwnedRegistryContract = artifacts.require('OwnedRegistry')

module.exports = async () => {
  const voterLabel = 'voter'
  const candidateLabel = 'candidate'
  const factory = await FactoryContract.deployed()
  const voterRegistryAddress = await factory.getRegistry.call(keccak256(voterLabel))
  const candidateRegistryAddress = await factory.getRegistry.call(keccak256(candidateLabel))
  console.log('Found Voter Registry at' + voterRegistryAddress)
  console.log('Found Candidate Registry at' + candidateRegistryAddress)
  fillRegistry(voterRegistryAddress, config.voterAccounts)
  fillRegistry(candidateRegistryAddress, config.candidateAccounts)
}

function fillRegistry (contractAddress, accounts) {
  const registry = OwnedRegistryContract.at(contractAddress)
  for (let i = 0; i < accounts.length; i++) {
    registry.whiteList(accounts[i])
    console.log('WhiteListed account: ' + accounts[i])
  }
}
