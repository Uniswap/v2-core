const MathExt = artifacts.require('MockMathExt');

const BN = web3.utils.BN;

let mathExt;

const {precisionUnits} = require('../helper');
const Helper = require('../helper');

contract(MathExt, function (accounts) {
  before('init contract', async () => {
    mathExt = await MathExt.new();
  });

  it('test mulInPercision', async () => {
    let x = precisionUnits.div(new BN(2));
    let y = new BN(500);
    let result = await mathExt.mulInPrecision(x, y);
    Helper.assertEqual(result, new BN(250), 'unexpected mulInPrecision');
  });

  it('test powInPercision', async () => {
    let x = precisionUnits.div(new BN(2));
    Helper.assertEqual(await mathExt.powInPercision(x, new BN(0)), precisionUnits, 'unexpected powInPercision');
    Helper.assertEqual(await mathExt.powInPercision(x, new BN(1)), x, 'unexpected powInPercision');
    Helper.assertEqual(
      await mathExt.powInPercision(x, new BN(2)),
      precisionUnits.div(new BN(4)),
      'unexpected powInPercision'
    );
    
    Helper.assertEqual(
      await mathExt.powInPercision(x, new BN(5)),
      precisionUnits.div(new BN(32)),
      'unexpected powInPercision'
    );
  });
});
