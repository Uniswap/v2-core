const path = require('path');
const fs = require('fs');
const { ethers, network } = require('hardhat');

(async () => {
  try {
    console.log('---------- Deploying to chain %d ----------', network.config.chainId);
    const QFactory = await ethers.getContractFactory('QuasarFactory');
    let factory = await QFactory.deploy();
    factory = await factory.deployed();

    console.log("----- %s -----", factory.address);

    const location = path.join(__dirname, '../factory_addresses.json');
    const fileExists = fs.existsSync(location);

    if (!fileExists) {
      fs.writeFileSync(
        location,
        JSON.stringify(
          {
            [network.config.chainId]: factory.address,
          },
          undefined,
          2
        )
      );
    } else {
      const contentBuf = fs.readFileSync(location);
      let contentJSON = JSON.parse(contentBuf.toString());
      contentJSON = { ...contentJSON, [network.config.chainId]: factory.address };
      fs.writeFileSync(location, JSON.stringify(contentJSON, undefined, 2));
    }
  } catch (error) {
    console.log(error.message);
  }
})();
