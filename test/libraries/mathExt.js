const MathExt = artifacts.require('MockMathExt');

const BN = web3.utils.BN;

let mathExt;

const {precisionUnits} = require('../helper');
const Helper = require('../helper');
const {expectRevert} = require('@openzeppelin/test-helpers');

contract('MathExt', function (accounts) {
  before('init contract', async () => {
    mathExt = await MathExt.new();
  });

  it('test mulInPrecision', async () => {
    let x = precisionUnits.div(new BN(2));
    let y = new BN(500);
    let result = await mathExt.mulInPrecision(x, y);
    Helper.assertEqual(result, new BN(250), 'unexpected mulInPrecision');
  });

  it('test powInPrecision', async () => {
    let x = precisionUnits.div(new BN(2));
    Helper.assertEqual(await mathExt.powInPrecision(x, new BN(0)), precisionUnits, 'unexpected powInPrecision');
    Helper.assertEqual(await mathExt.powInPrecision(x, new BN(1)), x, 'unexpected powInPrecision');
    Helper.assertEqual(
      await mathExt.powInPrecision(x, new BN(2)),
      precisionUnits.div(new BN(4)),
      'unexpected powInPrecision'
    );

    Helper.assertEqual(
      await mathExt.powInPrecision(x, new BN(5)),
      precisionUnits.div(new BN(32)),
      'unexpected powInPrecision'
    );

    await expectRevert(
      mathExt.powInPrecision(Helper.precisionUnits.add(new BN(1)), new BN(5)),
      'MathExt: x > PRECISION'
    );
  });

  it('test sqrt', async () => {
    Helper.assertEqual(await mathExt.sqrt(0), new BN(0));
    Helper.assertEqual(await mathExt.sqrt(1), new BN(1));
    Helper.assertEqual(await mathExt.sqrt(2), new BN(1));
    Helper.assertEqual(await mathExt.sqrt(3), new BN(1));

    Helper.assertEqual(await mathExt.sqrt(4), new BN(2));
    Helper.assertEqual(await mathExt.sqrt(8), new BN(2));
    Helper.assertEqual(await mathExt.sqrt(9), new BN(3));
  });
});
