const FeeFomula = artifacts.require('MockFeeFomula');
const VolumeTrendRecorder = artifacts.require('MockVolumeTrendRecorder');

const BN = web3.utils.BN;

const Helper = require('../helper');

const fs = require('fs');

contract('ema simulation', accounts => {
  // this is a long run test so disable it when running test
  it.skip('simulate fee fomula increase', async () => {
    const baseVolume = new BN(10).pow(new BN(18));
    let feeFomula = await FeeFomula.new();
    let recorder = await VolumeTrendRecorder.new(baseVolume);
    let recordInfo = await recorder.mockGetInfo();
    let block = recordInfo._lastTradeBlock.toNumber();
    const path = 'simulation/feeIncrease.txt';

    let fd;
    try {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
      fd = fs.openSync(path, 'a');
      fs.appendFileSync(fd, `block\tshorEMA\tlongEMA\trFactor\tfee\n`, 'utf8');
      for (let i = 0; i < 10800; i++) {
        await recorder.mockRecordNewUpdatedVolume(new BN(2).mul(baseVolume), block);

        if (i % 20 == 0) {
          let rFactor = await recorder.mockGetRFactor(block + 1);
          let recorderData = await recorder.getVolumeTrendData();
          let fee = await feeFomula.getFee(rFactor);
          fs.appendFileSync(
            fd,
            `${i}\t${recorderData._shortEMA}\t${recorderData._longEMA}\t${rFactor.toString()}\t${fee.toString()}\n`,
            'utf8'
          );
        }
        block++;
      }
    } catch (err) {
      /* Handle the error */
      console.log(err);
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }
  }).timeout(500000);

  it.skip('simulate fee fomula decrease', async () => {
    const baseVolume = new BN(10).pow(new BN(18));
    let feeFomula = await FeeFomula.new();
    let recorder = await VolumeTrendRecorder.new(baseVolume);
    let recordInfo = await recorder.mockGetInfo();
    let block = recordInfo._lastTradeBlock.toNumber();
    const path = 'simulation/feeDecrease.txt';

    let fd;
    try {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
      fd = fs.openSync(path, 'a');
      fs.appendFileSync(fd, `block\tshorEMA\tlongEMA\trFactor\tfee\n`, 'utf8');
      for (let i = 0; i < 10800; i += 20) {
        if (i % 20 == 0) {
          let rFactor = await recorder.mockGetRFactor(block + 1);
          let recorderData = await recorder.getVolumeTrendData();
          let fee = await feeFomula.getFee(rFactor);
          fs.appendFileSync(
            fd,
            `${i}\t${recorderData._shortEMA}\t${recorderData._longEMA}\t${rFactor.toString()}\t${fee.toString()}\n`,
            'utf8'
          );
        }
        block += 20;
      }
    } catch (err) {
      /* Handle the error */
      console.log(err);
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }
  }).timeout(500000);
});
