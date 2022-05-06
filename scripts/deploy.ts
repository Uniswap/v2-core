import { ethers } from "hardhat";

async function main() {
  const ContractFactory = await ethers.getContractFactory("UniswapV2Factory");
  const instance = await ContractFactory.deploy(process.env.FEE_SETTER || "");

  await instance.deployed();

  console.log("Contract deployed to:", instance.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
