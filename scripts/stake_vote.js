const TRLContract = artifacts.require('TRL')
const Standard20TokenMock = artifacts.require('Standard20TokenMock')
const OwnedRegistryContract = artifacts.require('OwnedRegistryMock')
const config = require('../config')
const keccak256 = require('js-sha3').keccak256
const trl_address = '0x4802979da379bbf17e929f8e97be959edcdfc741'
const admin_account = '0x00B8FBD65D61b7DFe34b9A3Bb6C81908d7fFD541'

module.exports = async () => {
  const TRLInstance = await TRLContract.at(trl_address)
  const FrontierTokenInstance = Standard20TokenMock.at('0x3a1f6b0992b1a3f2a15f52099cf172e9bea930de')
  const voterRegistry = OwnedRegistryContract.at('0x5226b7904424d2a12055204b74a842558d525b38')
  const isWL = await voterRegistry.isWhitelisted(admin_account)
  console.log(isWL)
  voterRegistry.whiteList(admin_account)
  const stakedTokens = 10
  console.log('yep')
  await FrontierTokenInstance.approve(trl_address, stakedTokens)
  console.log('yep')
  const totalPreStaked = await FrontierTokenInstance.allowance.call(admin_account, trl_address)
  console.log('Total Pre staked' + totalPreStaked)
  await TRLInstance.buyTokenVotes(totalPreStaked)

  console.log('yep')
  const currentPeriod = await TRLInstance.currentPeriod.call()
  console.log(currentPeriod.toNumber())
  const balance = await TRLInstance.votesReceived.call(currentPeriod, '0xbaA5d582b0ACdc1D56Bc3D3CA83c4F6f89BdE54C')
  console.log(balance)
  const tx = await TRLInstance.vote('0xbaA5d582b0ACdc1D56Bc3D3CA83c4F6f89BdE54C', totalPreStaked)
  console.log(tx)
}
