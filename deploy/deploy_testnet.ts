import { run, ethers, network } from "hardhat";
import {
    UniswapV2Factory__factory,
    TestnetERC20__factory,
} from "../typechain"; 
import fs from 'fs';

async function main() {
    await run("compile");

    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts from: ${deployer.address}`);

    const { factory } = require(`${process.cwd()}/addresses/${network.config.chainId}/factory.json`);
    const uniFactory = UniswapV2Factory__factory.connect(factory, deployer);
  
    const TokenA = new TestnetERC20__factory(deployer);
    const tokenA = await TokenA.deploy("Token A", "A");
    await tokenA.deployed();
    console.log(`Token A deployed to ${tokenA.address}`);

    const TokenB = new TestnetERC20__factory(deployer);
    const tokenB = await TokenB.deploy("Token B", "B");
    await tokenB.deployed();
    console.log(`Token B deployed to ${tokenB.address}`);
    
    await uniFactory.createPair(tokenA.address, tokenB.address);
    const allPairsLength = await uniFactory.allPairsLength();
    const pair = await uniFactory.allPairs(allPairsLength.sub(1))
    console.log(`Pair created at address ${pair}`)
    
    const addressPath = `${process.cwd()}/addresses/${network.config.chainId}/testnet.json`;
    const addressBook = {
        tokenA: tokenA.address,
        tokenB: tokenB.address,
        pair,
    };

    fs.writeFileSync(
        addressPath,
        JSON.stringify(addressBook, null, 2)
    );
}
  
main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
