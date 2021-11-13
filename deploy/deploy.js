const { BigNumber } = require("@ethersproject/bignumber");
const hardhat = require("hardhat");

module.exports = async ({
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) => {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();
    // const { deployer } = await hre.ethers.getSigners();

    console.log("Deploying contracts with account:", deployer);

    const WAVAX = await deploy("WAVAX", {
        from: deployer,
        gasLimit: 4000000,
        args: [],
    })

    console.log("WAVAX deployed at:", WAVAX.address);

    const uniswapV2Factory = await deploy("UniswapV2Factory", {
        from: deployer,
        gasLimit: 4000000,
        args: [deployer],
    });

    console.log("UniswapV2Factory deployed at:", uniswapV2Factory.address);

    const uniswapV2Pair = await deploy("UniswapV2Pair", {
        from: deployer,
        gasLimit: 4000000,
        args: [],
    })

    console.log("Uniswapv2Pair deployed at:", uniswapV2Pair.address);

    const uniswapV2ERC20 = await deploy("UniswapV2ERC20", {
        from: deployer,
        gasLimit: 4000000,
        args: [],
    })

    console.log("UniswapV2ERC20 deployed at", uniswapV2ERC20.address);
}
