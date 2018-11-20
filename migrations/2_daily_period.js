const DailyPeriod = artifacts.require('Daily.sol');
const DateTime = artifacts.require('DateTime.sol');

module.exports = function (deployer) {
    deployer.deploy(DateTime).then(() => {
        deployer.deploy(DailyPeriod);
    });
    deployer.link(DateTime, DailyPeriod);
};