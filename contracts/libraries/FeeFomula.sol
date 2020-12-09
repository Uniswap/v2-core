// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

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

    /// @dev calculate fee from rFactor with resolution = 10 ^ 18
    function getFee(uint256 rFactor) internal pure returns (uint256) {
        if (rFactor >= R0) {
            return C0;
        } else if (rFactor >= PRECISION) {
            // C1 + A * (r-U)^3 + b * (r -U)
            if (rFactor > U) {
                uint256 tmp = rFactor - U;
                return
                    (C1 + A.mulInPercision(tmp.unsafePowInPercision(3)) + B.mulInPercision(tmp)) /
                    10000;
            } else {
                uint256 tmp = U - rFactor;
                return
                    (C1 - A.mulInPercision(tmp.unsafePowInPercision(3)) - B.mulInPercision(tmp)) /
                    10000;
            }
        } else {
            uint256 tmp = (rFactor > G ? (rFactor - G) : (G - rFactor));
            tmp = tmp.unsafePowInPercision(2);
            uint256 tmp2 = F.mul(tmp).div(tmp.add(L));
            if (rFactor > G) {
                return (C2 + tmp2) / 10000;
            } else {
                return (C2 - tmp2) / 10000;
            }
        }
    }
}
