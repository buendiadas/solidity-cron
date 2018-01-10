let PrivateList = artifacts.require("./lib/PrivateList.sol");

module.exports = function(deployer) {
  deployer.deploy(PrivateList);
};
