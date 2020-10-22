const VolumeTrendRecorder = artifacts.require('MockVolumeTrendRecorder');

const BN = web3.utils.BN;

const {get} = require('http');
const {precisionUnits} = require('./helper');
const Helper = require('./helper');

const WINDOW_TIME = 7200;
const ALPHA_SHORT = new BN('153846153846153846');
const ALPHA_LONG = new BN('74074074074074074');

contract('VolumeTrendRecorder', function (accounts) {
  it('test no volume at window 0 and 1', async () => {
    let currentBlockTime = await Helper.getCurrentBlockTime();
    let timeStamp0 =
      new BN(currentBlockTime)
        .div(new BN(WINDOW_TIME))
        .mul(new BN(WINDOW_TIME))
        .toNumber();

    let ema0 = new BN(20000);
    let recorder = await VolumeTrendRecorder.new(ema0);
    let data = [0, 0, 0];
    let timeStamp = timeStamp0 + 1;
    rFactor = await recorder.mockGetRFactor(new BN(timeStamp));
    let numerator = getEMA(ema0, timeStamp0, data, ALPHA_SHORT, timeStamp);
    let denominator = getEMA(ema0, timeStamp0, data, ALPHA_LONG, timeStamp);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');

    timeStamp = timeStamp0 + WINDOW_TIME + 1;
    rFactor = await recorder.mockGetRFactor(new BN(timeStamp));
    numerator = getEMA(ema0, timeStamp0, data, ALPHA_SHORT, timeStamp);
    denominator = getEMA(ema0, timeStamp0, data, ALPHA_LONG, timeStamp);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
  });

  it('test 2 trade at window 0, 1 trade at window 1', async () => {
    let currentBlockTime = await Helper.getCurrentBlockTime();
    let timeStamp0 =
      new BN(currentBlockTime)
        .div(new BN(WINDOW_TIME))
        .mul(new BN(WINDOW_TIME))
        .toNumber();

    let ema0 = new BN(20000);
    let recorder = await VolumeTrendRecorder.new(ema0);
    let data = [0];
    let timeStamp = timeStamp0 + 5;
    rFactor = await recorder.mockGetRFactor(new BN(timeStamp));
    let numerator = getEMA(ema0, timeStamp0, data, ALPHA_SHORT, timeStamp);
    let denominator = getEMA(ema0, timeStamp0, data, ALPHA_LONG, timeStamp);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
    //create an update volume and data
    await recorder.mockUpdateEma(new BN(0));
    await recorder.mockUpdateVolume(new BN(5000), new BN(0), timeStamp);
    data = [5000, 0];

    // check if rFactor match
    timeStamp = timeStamp0 + 1800;
    rFactor = await recorder.mockGetRFactor(new BN(timeStamp));
    numerator = getEMA(ema0, timeStamp0, data, ALPHA_SHORT, timeStamp);
    denominator = getEMA(ema0, timeStamp0, data, ALPHA_LONG, timeStamp);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
    //create an update volume and data
    await recorder.mockUpdateEma(new BN(0));
    await recorder.mockUpdateVolume(new BN(3000), new BN(0), timeStamp);
    data = [8000, 0];

    // check if rFactor match
    timeStamp = timeStamp0 + WINDOW_TIME + 60;
    rFactor = await recorder.mockGetRFactor(new BN(timeStamp));
    numerator = getEMA(ema0, timeStamp0, data, ALPHA_SHORT, timeStamp);
    denominator = getEMA(ema0, timeStamp0, data, ALPHA_LONG, timeStamp);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
    //create an update volume and data
    await recorder.mockUpdateEma(new BN(1));
    await recorder.mockUpdateVolume(new BN(9000), new BN(1), timeStamp);
    data = [8000, 9000, 0];

    // check if rFactor match
    timeStamp = timeStamp0 + WINDOW_TIME * 2 + 60;
    rFactor = await recorder.mockGetRFactor(new BN(timeStamp));
    numerator = getEMA(ema0, timeStamp0, data, ALPHA_SHORT, timeStamp);
    denominator = getEMA(ema0, timeStamp0, data, ALPHA_LONG, timeStamp);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
  });

  it('test 1 trade at window 0, 0 no trade at window 1, 1 trade at window 2', async () => {
    let currentBlockTime = await Helper.getCurrentBlockTime();
    let timeStamp0 =
      new BN(currentBlockTime)
        .div(new BN(WINDOW_TIME))
        .mul(new BN(WINDOW_TIME))
        .toNumber();

    let ema0 = new BN(20000);
    let recorder = await VolumeTrendRecorder.new(ema0);
    let data = [0, 0, 0];
    let timeStamp = timeStamp0 + 5;
    rFactor = await recorder.mockGetRFactor(new BN(timeStamp));
    let numerator = getEMA(ema0, timeStamp0, data, ALPHA_SHORT, timeStamp);
    let denominator = getEMA(ema0, timeStamp0, data, ALPHA_LONG, timeStamp);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
    //create an update volume and data
    await recorder.mockUpdateEma(new BN(0));
    await recorder.mockUpdateVolume(new BN(5000), new BN(0), timeStamp);
    data = [5000, 0, 0];

    // check if rFactor match
    timeStamp = timeStamp0 + WINDOW_TIME * 2 + 5;
    rFactor = await recorder.mockGetRFactor(new BN(timeStamp));
    numerator = getEMA(ema0, timeStamp0, data, ALPHA_SHORT, timeStamp);
    denominator = getEMA(ema0, timeStamp0, data, ALPHA_LONG, timeStamp);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
    //create an update volume and data
    await recorder.mockUpdateEma(new BN(2));
    await recorder.mockUpdateVolume(new BN(3000), new BN(2), timeStamp);
    data = [5000, 0, 3000, 0];

    // check if rFactor match
    timeStamp = timeStamp0 + WINDOW_TIME * 3 + 5;
    rFactor = await recorder.mockGetRFactor(new BN(timeStamp));
    numerator = getEMA(ema0, timeStamp0, data, ALPHA_SHORT, timeStamp);
    denominator = getEMA(ema0, timeStamp0, data, ALPHA_LONG, timeStamp);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
  });

  it('test 1 trade at window 0, 0 no trade at window 1 and 2, 1 trade at window 3', async () => {
    let currentBlockTime = await Helper.getCurrentBlockTime();
    let timeStamp0 =
      new BN(currentBlockTime)
        .div(new BN(WINDOW_TIME))
        .mul(new BN(WINDOW_TIME))
        .toNumber();

    let ema0 = new BN(20000);
    let recorder = await VolumeTrendRecorder.new(ema0);
    let data = [0, 0, 0];
    let timeStamp = timeStamp0 + 5;
    rFactor = await recorder.mockGetRFactor(new BN(timeStamp));
    let numerator = getEMA(ema0, timeStamp0, data, ALPHA_SHORT, timeStamp);
    let denominator = getEMA(ema0, timeStamp0, data, ALPHA_LONG, timeStamp);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
    //create an update volume and data
    await recorder.mockUpdateEma(new BN(0));
    await recorder.mockUpdateVolume(new BN(5000), new BN(0), timeStamp);
    data = [5000, 0, 0, 0, 0];

    // check if rFactor match
    timeStamp = timeStamp0 + WINDOW_TIME * 3 + 5;
    rFactor = await recorder.mockGetRFactor(new BN(timeStamp));
    numerator = getEMA(ema0, timeStamp0, data, ALPHA_SHORT, timeStamp);
    denominator = getEMA(ema0, timeStamp0, data, ALPHA_LONG, timeStamp);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertApproximate(rFactor, expectedRFactor, 'unexpected rFactor');
    //create an update volume and data
    await recorder.mockUpdateEma(new BN(3));
    await recorder.mockUpdateVolume(new BN(3000), new BN(3), timeStamp);
    data = [5000, 0, 0, 3000, 0];

    // check if rFactor match
    timeStamp = timeStamp0 + WINDOW_TIME * 4 + 5;
    rFactor = await recorder.mockGetRFactor(new BN(timeStamp));
    numerator = getEMA(ema0, timeStamp0, data, ALPHA_SHORT, timeStamp);
    denominator = getEMA(ema0, timeStamp0, data, ALPHA_LONG, timeStamp);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertApproximate(rFactor, expectedRFactor, 'unexpected rFactor');
  });
});

function getEMA (ema0, timeStamp0, data, alpha, currentTimeStamp) {
  let timeStamp = timeStamp0;
  let ema = ema0;
  let index = 0;
  while (currentTimeStamp - WINDOW_TIME > timeStamp) {
    ema = alpha
      .mul(new BN(data[index]))
      .add(precisionUnits.sub(alpha).mul(ema))
      .div(precisionUnits);
    index++;
    timeStamp += WINDOW_TIME;
  }
  return ema;
}
