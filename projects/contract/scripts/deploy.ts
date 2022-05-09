import { ethers } from "hardhat";

async function main() {
  const WAstar = "0xAeaaf0e2c81Af264101B9129C00F4440cCF0F720";

  const SwapFactory = await ethers.getContractFactory("UniswapV2Factory");
  const swapFactory = await SwapFactory.deploy(process.env.FEE_SETTER || "");
  await swapFactory.deployed();
  console.log("swapFactory deployed to:", swapFactory.address);

  const RouterFactory = await ethers.getContractFactory("UniswapV2Router02");
  const swapRouter = await RouterFactory.deploy(swapFactory.address, WAstar);
  await swapRouter.deployed();

  console.log("swapRouter deployed to:", swapRouter.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
