const WalletHelper = artifacts.require("WalletHelper");

module.exports = function (deployer) {
  deployer.deploy(WalletHelper);
};