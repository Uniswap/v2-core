const Migrations = artifacts.require("Migrations");
const UniswapV2Factory = artifacts.require("UniswapV2Factory");

module.exports = function (deployer, network, accounts) {
  console.log(accounts[0])
  deployer.deploy(Migrations);
  deployer.deploy(UniswapV2Factory, accounts[0]).then(function (instance) {
    console.log("UniswapV2Factory:" + instance.address);
  });  
  
};
