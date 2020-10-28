const {ethers} = require('@nomiclabs/buidler');

async function main() {
  const accounts = await web3.eth.getAccounts();
  // We get the contract to deploy
  const XYZSwapFactory = await ethers.getContractFactory('XYZSwapFactory');
  const factory = await XYZSwapFactory.deploy(accounts[0]);

  console.log('Factory deployed to:', factory.address);
  const XYZSwapRouter01 = await ethers.getContractFactory('XYZSwapRouter01');
  const router01 = await XYZSwapRouter01.deploy(factory.address);
  console.log('Router deployed to:', router01.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
