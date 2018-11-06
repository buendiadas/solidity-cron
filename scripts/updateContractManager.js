const ContractManager = require('contract-manager-client')
const TRL_VERSION = process.env.TRL_VERSION

let updates = []

const TRL_PROXY_ADDR = process.env.PROXY_ADDR
const TRL_ABI = require('../build/contracts/TRL.json')
updates.push({name: 'trl', address: TRL_PROXY_ADDR, abi: TRL_ABI})

const SUBSCRIPTION_ADDR = process.env.SUBSCRIPTION_ADDR
const SUBSCRIPTION_ABI = require('../build/contracts/Subscription.json')
updates.push({name: 'subscription', address: SUBSCRIPTION_ADDR, abi: SUBSCRIPTION_ABI})

const TOKEN_ADDR = process.env.TOKEN_ADDR
const TOKEN_ABI = require('../build/contracts/Standard20TokenMock.json')
updates.push({name: 'token', address: TOKEN_ADDR, abi: TOKEN_ABI})

const REGISTRY_FACTORY_ADDR = process.env.REGISTRY_FACTORY_ADDR
const REGISTRY_FACTORY_ABI = require('../build/contracts/OwnedRegistryFactory.json')
updates.push({name: 'registry-factory', address: REGISTRY_FACTORY_ADDR, abi: REGISTRY_FACTORY_ABI})

const VAULT_ADDR = process.env.VAULT_ADDR
const VAULT_ABI = require('../build/contracts/Vault.json')
updates.push({name: 'vault', address: VAULT_ADDR, abi: VAULT_ABI})

async function updateContractManager (updates) {
  for (let update of updates) {
    let updateState = await ContractManager.updateContract(update.name, TRL_VERSION, update.abi, update.address)
    console.log('Updated ' + update.name + ' -> ' + updateState)
  }
}
if (process.env.VAULT_ADDR && process.env.REGISTRY_FACTORY_ADDR && process.env.TOKEN_ADDR && process.env.SUBSCRIPTION_ADDR && process.env.PROXY_ADDR) {
  updateContractManager(updates)
} else {
  console.log('Env variables not set')
  process.exit(1)
}
