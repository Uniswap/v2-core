pragma solidity 0.6.6;

import "./MathExt.sol";

library FeeFomula {
    using SafeMath for uint256;
    using MathExt for uint256;

    uint256 private constant PRECISION = 10**18;
    uint256 private constant R0 = 1477405064814996100; // 1.4774050648149961

    uint256 private constant C0 = (60 * PRECISION) / 10000;

    uint256 private constant A = uint256(PRECISION * 20000) / 27;
    uint256 private constant B = uint256(PRECISION * 250) / 9;
    uint256 private constant C1 = uint256(PRECISION * 985) / 27;
    uint256 private constant U = (120 * PRECISION) / 100;

    uint256 private constant G = (836 * PRECISION) / 1000;
    uint256 private constant F = 5 * PRECISION;
    uint256 private constant L = (2 * PRECISION) / 10000;
    // C2 = 25 * PRECISION - (F * (PRECISION - G)**2) / ((PRECISION - G)**2 + L * PRECISION)
    uint256 private constant C2 = 20036905816356657810;

    /// @dev calculate fee from rFactorInPrecision, see section 3.2 in xyzswap white paper
    /// @dev fee in [15, 60] bps
    /// @return fee percentage in Precision
    function getFee(uint256 rFactorInPrecision) internal pure returns (uint256) {
        if (rFactorInPrecision >= R0) {
            return C0;
        } else if (rFactorInPrecision >= PRECISION) {
            // C1 + A * (r-U)^3 + b * (r -U)
            if (rFactorInPrecision > U) {
                uint256 tmp = rFactorInPrecision - U;
                uint256 tmp3 = tmp.unsafePowInPrecision(3);
                return (C1.add(A.mulInPrecision(tmp3)).add(B.mulInPrecision(tmp))) / 10000;
            } else {
                uint256 tmp = U - rFactorInPrecision;
                uint256 tmp3 = tmp.unsafePowInPrecision(3);
                return C1.sub(A.mulInPrecision(tmp3)).sub(B.mulInPrecision(tmp)) / 10000;
            }
        } else {
            // [ C2 + sign(r - G) *  F * (r-G) ^2 / (L + (r-G) ^2) ] / 10000
            uint256 tmp = (
                rFactorInPrecision > G ? (rFactorInPrecision - G) : (G - rFactorInPrecision)
            );
            tmp = tmp.unsafePowInPrecision(2);
            uint256 tmp2 = F.mul(tmp).div(tmp.add(L));
            if (rFactorInPrecision > G) {
                return C2.add(tmp2) / 10000;
            } else {
                return C2.sub(tmp2) / 10000;
            }
        }
    }
}
