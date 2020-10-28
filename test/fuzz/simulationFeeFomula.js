const FeeFomula = artifacts.require('MockFeeFomula');

const BN = web3.utils.BN;

const Helper = require('../helper');

const fs = require('fs');

contract('FeeFomula', accounts => {
  // this is a long run test so disable it when running test
  it.skip('simulate fee fomula', async () => {
    let feeFomula = await FeeFomula.new();
    let out = [];
    let fd;
    try {
      fd = fs.openSync('simulation/fee.txt', 'a');
      fs.appendFileSync(fd, `rFactor\tfee\n`, 'utf8');
      for (let i = 0; i < 2000; i++) {
        if (i % 1000 == 0) {
          console.log(i);
        }
        let rFactor = new BN(i).mul(Helper.precisionUnits).div(new BN(1000));
        let fee = await feeFomula.getFee(rFactor);
        fs.appendFileSync(fd, `${rFactor.toString()}\t${fee.toString()}\n`, 'utf8');
      }
    } catch (err) {
      /* Handle the error */
      console.log(err);
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }
  }).timeout(500000);
});
