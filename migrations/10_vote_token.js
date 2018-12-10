const config = require('../config')
const VoteTokenContract = artifacts.require('VoteToken')
const PeriodContract = artifacts.require('Daily');

module.exports = (deployer) => {
  deployer.then(async () => {
    if (config.proxyMigration) {
        VoteTokenInstance = await deployer.deploy(VoteTokenContract)
        PeriodTokenInstance = await PeriodContract.deployed()
        await VoteTokenInstance.setPeriod(PeriodTokenInstance.address);
    }
  })
}
