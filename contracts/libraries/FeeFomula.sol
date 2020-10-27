// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./MathExt.sol";

library FeeFomula {
    using SafeMath for uint256;
    using MathExt for uint256;

    uint256 private constant PRECISION = 10**18;
    uint256 private constant R0 = (135 * PRECISION) / 100;

    uint256 private constant C0 = (60 * PRECISION) / 10000;

    uint256 private constant A = uint256(PRECISION * 5000) / 3;
    uint256 private constant B = uint256(PRECISION * 275) / 6;
    uint256 private constant C1 = uint256(PRECISION * 75) / 2;
    uint256 private constant U = (115 * PRECISION) / 100;

    uint256 private constant G = (886 * PRECISION) / 1000;
    uint256 private constant F = 5 * PRECISION;
    uint256 private constant L = (2 * PRECISION) / 10000;
    // C2 = 25 * PRECISION - (F * (PRECISION - G)**2) / ((PRECISION - G)**2 + L * PRECISION)
    uint256 private constant C2 = 20075780539557441649;

    function getFee(uint256 rFactor) internal pure returns (uint256) {
        if (rFactor >= R0) {
            return C0;
        } else if (rFactor >= PRECISION) {
            if (rFactor > U) {
                uint256 tmp = rFactor - U;
                return
                    (C1 +
                        A.unsafeMulInPercision(tmp.unsafeExpInPercision(3)) +
                        B.unsafeMulInPercision(tmp)) / 10000;
            } else {
                uint256 tmp = U - rFactor;
                return
                    (C1 -
                        A.unsafeMulInPercision(tmp.unsafeExpInPercision(3)) -
                        B.unsafeMulInPercision(tmp)) / 10000;
            }
        } else {
            uint256 tmp = (rFactor > G ? (rFactor - G) : (G - rFactor));
            tmp = tmp.expInPercision(2);
            uint256 tmp2 = F.mul(tmp).div(tmp.add(L));
            if (rFactor > G) {
                return (C2 + tmp2) / 10000;
            } else {
                return (C2 - tmp2) / 10000;
            }
        }
    }
}
