const Migrations = artifacts.require("Migrations");
const UniswapV2Factory = artifacts.require("UniswapV2Factory");

module.exports = function (deployer, network, accounts) {
  console.log(accounts[0])
  deployer.deploy(Migrations);

  var feeToSetter = accounts[0];
  deployer.deploy(UniswapV2Factory, feeToSetter).then(function (instance) {
    console.log("UniswapV2Factory:" + instance.address);
  });  

  
  // TODO 设置收益地址
  
};
