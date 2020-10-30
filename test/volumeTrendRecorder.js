const VolumeTrendRecorder = artifacts.require('MockVolumeTrendRecorder');

const BN = web3.utils.BN;

const {precisionUnits} = require('./helper');
const Helper = require('./helper');

const ALPHA_SHORT = Helper.precisionUnits.mul(new BN(2)).div(new BN(5401));
const ALPHA_LONG = Helper.precisionUnits.mul(new BN(2)).div(new BN(10801));
let ema0 = new BN(20000);

contract('VolumeTrendRecorder', function (accounts) {
  it('test no volume at block 0 and 1', async () => {
    let recorder = await VolumeTrendRecorder.new(ema0);
    let recordInfo = await recorder.mockGetInfo();
    let block0 = recordInfo._lastTradeBlock.toNumber();

    let data = [0, 0, 0];
    let block = block0;
    rFactor = await recorder.mockGetRFactor(new BN(block));
    let numerator = getEMA(ema0, block0, data, ALPHA_SHORT, block);
    let denominator = getEMA(ema0, block0, data, ALPHA_LONG, block);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');

    block = block0 + 1;
    rFactor = await recorder.mockGetRFactor(new BN(block));
    numerator = getEMA(ema0, block0, data, ALPHA_SHORT, block);
    denominator = getEMA(ema0, block0, data, ALPHA_LONG, block);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);

    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
  });

  it('test 2 trade at block 0, 1 trade at block 1', async () => {
    let recorder = await VolumeTrendRecorder.new(ema0);
    let recordInfo = await recorder.mockGetInfo();
    let block0 = recordInfo._lastTradeBlock.toNumber();

    let data = [0];
    let block = block0;
    rFactor = await recorder.mockGetRFactor(new BN(block));
    let numerator = getEMA(ema0, block0, data, ALPHA_SHORT, block);
    let denominator = getEMA(ema0, block0, data, ALPHA_LONG, block);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
    //create an update volume and data
    await recorder.mockUpdateVolume(new BN(5000), block);
    data = [5000, 0];

    // check if rFactor should unchanged in the same block
    rFactor = await recorder.mockGetRFactor(new BN(block));
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');

    //create an update volume and data
    await recorder.mockUpdateVolume(new BN(3000), block);
    data = [8000, 0];

    // check if rFactor match
    block = block0 + 1;
    rFactor = await recorder.mockGetRFactor(new BN(block));
    numerator = getEMA(ema0, block0, data, ALPHA_SHORT, block);
    denominator = getEMA(ema0, block0, data, ALPHA_LONG, block);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
    //create an update volume and data
    await recorder.mockUpdateVolume(new BN(9000), block);
    data = [8000, 9000, 0];

    // check if rFactor match
    block = block0 + 2;
    rFactor = await recorder.mockGetRFactor(new BN(block));
    numerator = getEMA(ema0, block0, data, ALPHA_SHORT, block);
    denominator = getEMA(ema0, block0, data, ALPHA_LONG, block);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
  });

  it('test 1 trade at window 0, 0 no trade at window 1, 1 trade at window 2', async () => {
    let recorder = await VolumeTrendRecorder.new(ema0);
    let recordInfo = await recorder.mockGetInfo();
    let block0 = recordInfo._lastTradeBlock.toNumber();

    let data = [0, 0, 0];
    let block = block0;
    rFactor = await recorder.mockGetRFactor(new BN(block));
    let numerator = getEMA(ema0, block0, data, ALPHA_SHORT, block);
    let denominator = getEMA(ema0, block0, data, ALPHA_LONG, block);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
    //create an update volume and data
    await recorder.mockUpdateVolume(new BN(5000), block);
    data = [5000, 0, 0];

    // check if rFactor match
    block = block0 + 2;
    rFactor = await recorder.mockGetRFactor(new BN(block));
    numerator = getEMA(ema0, block0, data, ALPHA_SHORT, block);
    denominator = getEMA(ema0, block0, data, ALPHA_LONG, block);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
    //create an update volume and data
    await recorder.mockUpdateVolume(new BN(3000), block);
    data = [5000, 0, 3000, 0];

    // check if rFactor match
    block = block0 + 3;
    rFactor = await recorder.mockGetRFactor(new BN(block));
    numerator = getEMA(ema0, block0, data, ALPHA_SHORT, block);
    denominator = getEMA(ema0, block0, data, ALPHA_LONG, block);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
  });

  it('test 1 trade at window 0, 0 no trade at window 1 and 2, 1 trade at window 3', async () => {
    let recorder = await VolumeTrendRecorder.new(ema0);
    let recordInfo = await recorder.mockGetInfo();
    let block0 = recordInfo._lastTradeBlock.toNumber();

    let data = [0, 0, 0];
    let block = block0;
    rFactor = await recorder.mockGetRFactor(new BN(block));
    let numerator = getEMA(ema0, block0, data, ALPHA_SHORT, block);
    let denominator = getEMA(ema0, block0, data, ALPHA_LONG, block);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
    //create an update volume and data
    await recorder.mockUpdateVolume(new BN(5000), block);
    data = [5000, 0, 0, 0, 0];

    // check if rFactor match
    block = block0 + 3;
    rFactor = await recorder.mockGetRFactor(new BN(block));
    numerator = getEMA(ema0, block0, data, ALPHA_SHORT, block);
    denominator = getEMA(ema0, block0, data, ALPHA_LONG, block);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertApproximate(rFactor, expectedRFactor, 'unexpected rFactor');
    //create an update volume and data
    await recorder.mockUpdateVolume(new BN(3000), block);
    data = [5000, 0, 0, 3000, 0];

    // check if rFactor match
    block = block0 + 4;
    rFactor = await recorder.mockGetRFactor(new BN(block));
    numerator = getEMA(ema0, block0, data, ALPHA_SHORT, block);
    denominator = getEMA(ema0, block0, data, ALPHA_LONG, block);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertApproximate(rFactor, expectedRFactor, 'unexpected rFactor');
  });

  it('test gas for long number of block without trade', async () => {
    let recorder = await VolumeTrendRecorder.new(new BN(Helper.precisionUnits));
    let recordInfo = await recorder.mockGetInfo();
    let block0 = recordInfo._lastTradeBlock.toNumber();

    let block = block0;
    let result = await recorder.mockUpdateVolume(new BN(5000), block);
    console.log(result.receipt.gasUsed);

    block = block0 + 1;
    result = await recorder.mockUpdateVolume(new BN(5000), block);
    console.log(result.receipt.gasUsed);

    block = block0 + 10000;
    result = await recorder.mockUpdateVolume(new BN(5000), block);
    console.log(result.receipt.gasUsed);
  });
});

function getEMA (ema0, block0, data, alpha, block) {
  let currentBlock = block0;
  let ema = ema0;
  let index = 0;
  for (currentBlock = block0; currentBlock < block; currentBlock++) {
    ema = alpha
      .mul(new BN(data[index]))
      .add(precisionUnits.sub(alpha).mul(ema))
      .div(precisionUnits);
    index++;
  }
  return ema;
}
