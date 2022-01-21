const UniswapV2ERC20 = artifacts.require("../contracts/UniswapV2ERC20");
const UniswapV2Factory = artifacts.require("../contracts/UniswapV2Factory");
const UniswapV2Pair = artifacts.require("../contracts/UniswapV2Pair");

module.exports = function (deployer) {
  deployer.deploy(UniswapV2ERC20);
  deployer.deploy(UniswapV2Factory);
  deployer.deploy(UniswapV2Pair);
};
