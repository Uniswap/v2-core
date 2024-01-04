const UniswapV2Factory = artifacts.require("UniswapV2Factory");
const UniswapV2ERC20 = artifacts.require("UniswapV2ERC20");
const UniswapV2ERC20Test = artifacts.require("UniswapV2ERC20Test");
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");

module.exports = function (deployer, network, accounts) {
  let factoryAddress, wethAddress;

  // Dummy WETH address for Ganache. Replace with actual WETH address on live networks.
  wethAddress = "0xc778417E063141139Fce010982780140Aa0cD5Ab";

  deployer.deploy(UniswapV2ERC20)
    .then(() => deployer.deploy(UniswapV2ERC20Test))
    .then(() => deployer.deploy(UniswapV2Factory, accounts[0]))
    .then((factory) => {
      factoryAddress = factory.address;
      console.log("UniswapV2Factory deployed at address:", factoryAddress);
      return deployer.deploy(UniswapV2Router02, factoryAddress, wethAddress);
    })
    .then((router) => {
      console.log("UniswapV2Router02 deployed at address:", router.address);
    });
};
