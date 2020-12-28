const VolumeTrendRecorder = artifacts.require('MockVolumeTrendRecorder');

const BN = web3.utils.BN;

const {expectRevert, expectEvent} = require('@openzeppelin/test-helpers');
const {precisionUnits} = require('./helper');
const Helper = require('./helper');

const ALPHA_SHORT = Helper.precisionUnits.mul(new BN(2)).div(new BN(5401));
const ALPHA_LONG = Helper.precisionUnits.mul(new BN(2)).div(new BN(10801));
const MaxUint128 = new BN(2).pow(new BN(128)).sub(new BN(1));

let ema0 = new BN(200000);

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
    let result = await recorder.mockRecordNewUpdatedVolume(new BN(50000), block);
    expectEvent.notEmitted(result, 'UpdateEMA');
    data = [50000, 0];
    let record = await recorder.getVolumeTrendData();
    Helper.assertEqual(record._shortEMA, ema0);
    Helper.assertEqual(record._longEMA, ema0);
    Helper.assertEqual(record._currentBlockVolume, new BN(50000));
    Helper.assertEqual(record._lastTradeBlock, block0);

    // check if rFactor should unchanged in the same block
    rFactor = await recorder.mockGetRFactor(new BN(block));
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');

    //create an update volume and data
    result = await recorder.mockRecordNewUpdatedVolume(new BN(30000), block);
    expectEvent.notEmitted(result, 'UpdateEMA');
    data = [80000, 0];
    record = await recorder.getVolumeTrendData();
    Helper.assertEqual(record._shortEMA, ema0);
    Helper.assertEqual(record._longEMA, ema0);
    Helper.assertEqual(record._currentBlockVolume, new BN(80000));
    Helper.assertEqual(record._lastTradeBlock, block);

    // check if rFactor match
    block = block0 + 1;
    rFactor = await recorder.mockGetRFactor(new BN(block));
    numerator = getEMA(ema0, block0, data, ALPHA_SHORT, block);
    denominator = getEMA(ema0, block0, data, ALPHA_LONG, block);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
    //create an update volume and data
    result = await recorder.mockRecordNewUpdatedVolume(new BN(9000), block);
    expectEvent(result, 'UpdateEMA', {
      shortEMA: numerator,
      longEMA: denominator,
      lastBlockVolume: new BN(80000),
      skipBlock: new BN(1)
    });

    data = [80000, 9000, 0];

    record = await recorder.getVolumeTrendData();
    Helper.assertEqual(record._shortEMA, numerator);
    Helper.assertEqual(record._longEMA, denominator);
    Helper.assertEqual(record._currentBlockVolume, new BN(9000));
    Helper.assertEqual(record._lastTradeBlock, block);

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
    await recorder.mockRecordNewUpdatedVolume(new BN(50000), block);
    data = [50000, 0, 0];
    let record = await recorder.getVolumeTrendData();
    Helper.assertEqual(record._shortEMA, ema0);
    Helper.assertEqual(record._longEMA, ema0);
    Helper.assertEqual(record._currentBlockVolume, new BN(50000));
    Helper.assertEqual(record._lastTradeBlock, block);

    // check if rFactor match
    block = block0 + 2;
    rFactor = await recorder.mockGetRFactor(new BN(block));
    numerator = getEMA(ema0, block0, data, ALPHA_SHORT, block);
    denominator = getEMA(ema0, block0, data, ALPHA_LONG, block);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertEqual(rFactor, expectedRFactor, 'unexpected rFactor');
    //create an update volume and data
    await recorder.mockRecordNewUpdatedVolume(new BN(30000), block);
    data = [50000, 0, 30000, 0];

    record = await recorder.getVolumeTrendData();
    Helper.assertApproximate(record._shortEMA, numerator);
    Helper.assertApproximate(record._longEMA, denominator);
    Helper.assertEqual(record._currentBlockVolume, new BN(30000));
    Helper.assertEqual(record._lastTradeBlock, block);

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
    await recorder.mockRecordNewUpdatedVolume(new BN(50000), block);
    data = [50000, 0, 0, 0, 0];
    let record = await recorder.getVolumeTrendData();
    Helper.assertEqual(record._shortEMA, ema0);
    Helper.assertEqual(record._longEMA, ema0);
    Helper.assertEqual(record._currentBlockVolume, new BN(50000));
    Helper.assertEqual(record._lastTradeBlock, block0);

    // check if rFactor match
    block = block0 + 3;
    rFactor = await recorder.mockGetRFactor(new BN(block));
    numerator = getEMA(ema0, block0, data, ALPHA_SHORT, block);
    denominator = getEMA(ema0, block0, data, ALPHA_LONG, block);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertApproximate(rFactor, expectedRFactor, 'unexpected rFactor');
    //create an update volume and data
    await recorder.mockRecordNewUpdatedVolume(new BN(30000), block);
    data = [50000, 0, 0, 30000, 0];
    record = await recorder.getVolumeTrendData();
    Helper.assertApproximate(record._shortEMA, numerator);
    Helper.assertApproximate(record._longEMA, denominator);
    Helper.assertEqual(record._currentBlockVolume, new BN(30000));
    Helper.assertEqual(record._lastTradeBlock, block);

    // check if rFactor match
    block = block0 + 4;
    rFactor = await recorder.mockGetRFactor(new BN(block));
    numerator = getEMA(ema0, block0, data, ALPHA_SHORT, block);
    denominator = getEMA(ema0, block0, data, ALPHA_LONG, block);
    expectedRFactor = precisionUnits.mul(numerator).div(denominator);
    Helper.assertApproximate(rFactor, expectedRFactor, 'unexpected rFactor');
  });

  it('test case volume exceeds max_uint128', async () => {
    let recorder = await VolumeTrendRecorder.new(new BN(Helper.precisionUnits));
    let recordInfo = await recorder.mockGetInfo();
    let block0 = recordInfo._lastTradeBlock.toNumber();
    await expectRevert(recorder.mockRecordNewUpdatedVolume(new BN(2).pow(new BN(128)), block0), 'volume exceeds valid range');
    await recorder.mockRecordNewUpdatedVolume(MaxUint128, block0);
    let record = await recorder.getVolumeTrendData();
    Helper.assertEqual(record._currentBlockVolume, MaxUint128);
  });

  it('test safeUint128', async () => {
    let recorder = await VolumeTrendRecorder.new(new BN(Helper.precisionUnits));
    await expectRevert(recorder.mockSafeUint128(new BN(2).pow(new BN(128))), 'overflow uint128');

    let out = await recorder.mockSafeUint128(MaxUint128);
    Helper.assertEqual(out, MaxUint128);
  });

  it('test gas for long number of block without trade', async () => {
    let recorder = await VolumeTrendRecorder.new(new BN(Helper.precisionUnits));
    let recordInfo = await recorder.mockGetInfo();
    let block0 = recordInfo._lastTradeBlock.toNumber();

    let block = block0;
    let result = await recorder.mockRecordNewUpdatedVolume(new BN(50000), block);
    let readGasCost = await recorder.testGasCostGetRFactor(block);
    console.log(`getRFactor for skipBlock=1 gasUsed=${readGasCost}`);
    result = await recorder.mockRecordNewUpdatedVolume(new BN(50000), block);
    console.log(`update volume skipBlock=0 gasUsed=${result.receipt.gasUsed}`);

    block = block + 1;
    readGasCost = await recorder.testGasCostGetRFactor(block);
    console.log(`getRFactor for skipBlock=1 gasUsed=${readGasCost}`);
    result = await recorder.mockRecordNewUpdatedVolume(new BN(50000), block);
    console.log(`update volume skipBlock=1 gasUsed=${result.receipt.gasUsed}`);

    block = block + 10000;
    readGasCost = await recorder.testGasCostGetRFactor(block);
    console.log(`getRFactor for skipBlock=1 gasUsed=${readGasCost}`);
    result = await recorder.mockRecordNewUpdatedVolume(new BN(50000), block);
    console.log(`update volume skipBlock=9999 gasUsed=${result.receipt.gasUsed}`);
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
