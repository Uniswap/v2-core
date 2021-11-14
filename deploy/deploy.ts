import { run, ethers, network } from "hardhat";
import {
    UniswapV2Factory__factory,
 } from "../typechain";
import fs from 'fs';

async function main() {
    await run("compile");

    const [deployer] = await ethers.getSigners();
  
    console.log(`Deploying contracts with from: ${deployer.address}`);
      
    const UniFactory = new UniswapV2Factory__factory(deployer);
    const uniFactory = await UniFactory.deploy(deployer.address);
    await uniFactory.deployed();
    console.log(`UniswapV2Factory deployed to ${uniFactory.address}`);

    const addressPath = `${process.cwd()}/addresses/${network.config.chainId}/factory.json`;
    const addressBook = {
        factory: uniFactory.address,
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
