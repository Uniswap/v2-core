const BN = web3.utils.BN;
const Helper = require('./helper');

module.exports.getAmountOut = async (amountIn, tokenIn, pair) => {
  let token0Addr = await pair.token0();
  let tradeInfo = await pair.getTradeInfo();
  let reserveIn = token0Addr == tokenIn.address ? tradeInfo._vReserve0 : tradeInfo._vReserve1;
  let reserveOut = token0Addr == tokenIn.address ? tradeInfo._vReserve1 : tradeInfo._vReserve0;

  let amountInWithFee = amountIn.mul(Helper.precisionUnits.sub(tradeInfo.feeInPrecision)).div(Helper.precisionUnits);
  let numerator = reserveIn.mul(reserveOut);
  let denominator = reserveIn.add(amountInWithFee);
  return reserveOut.sub(numerator.add(denominator.sub(new BN(1))).div(denominator));
};

module.exports.getAmountIn = async (amountOut, tokenIn, pair) => {
  let token0Addr = await pair.token0();
  let tradeInfo = await pair.getTradeInfo();
  let reserveIn = token0Addr == tokenIn.address ? tradeInfo._vReserve0 : tradeInfo._vReserve1;
  let reserveOut = token0Addr == tokenIn.address ? tradeInfo._vReserve1 : tradeInfo._vReserve0;
  // amountIn = reserveIn * amountOut / (reserveOut - amountOut)
  let numerator = reserveIn.mul(amountOut);
  let denominator = reserveOut.sub(amountOut);
  let amountIn = numerator.div(denominator).add(new BN(1));
  // amountIn = floor(amountIn * precision / (precision - feeInPrecision))
  numerator = amountIn.mul(Helper.precisionUnits);
  denominator = Helper.precisionUnits.sub(tradeInfo.feeInPrecision);
  return (amountIn = numerator.add(denominator.sub(new BN(1))).div(denominator));
};

module.exports.getFee = (totalSuppy, k, kLast, governmentFeeBps) => {
  const rootK = Helper.sqrt(k);
  const rootKLast = Helper.sqrt(kLast);
  return totalSuppy
    .mul(rootK.sub(rootKLast))
    .mul(governmentFeeBps)
    .div(rootK.add(rootKLast).mul(new BN(5000)));
};

// get price range of token1 / token0
module.exports.getPriceRange = tradeInfo => {
  let maxRate;
  if (tradeInfo._reserve0.eq(tradeInfo._vReserve0)) {
    maxRate = Infinity;
  } else {
    let limVReserve0 = tradeInfo._vReserve0.sub(tradeInfo._reserve0);
    let limVReserve1 = tradeInfo._vReserve1.mul(tradeInfo._vReserve0).div(limVReserve0);
    maxRate = limVReserve1.mul(Helper.precisionUnits).div(limVReserve0);
  }

  let minRate;
  if (tradeInfo._reserve1.eq(tradeInfo._vReserve1)) {
    minRate = new BN(0);
  } else {
    let limVReserve1 = tradeInfo._vReserve1.sub(tradeInfo._reserve1);
    let limVReserve0 = tradeInfo._vReserve1.mul(tradeInfo._vReserve0).div(limVReserve1);
    minRate = limVReserve1.mul(Helper.precisionUnits).div(limVReserve0);
  }
  return [minRate, maxRate];
};
