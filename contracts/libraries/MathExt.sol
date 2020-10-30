// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";

library MathExt {
    using SafeMath for uint256;

    uint256 public constant PRECISION = (10**18);

    /// @dev Returns x*y in precision
    function mulInPercision(uint256 x, uint256 y) internal pure returns (uint256) {
        return x.mul(y).div(PRECISION);
    }

    /// @dev Returns x*y in precision
    /// Assume x < 2 **128 -1 and y < precision this can not overflow
    function unsafeMulInPercision(uint256 x, uint256 y) internal pure returns (uint256) {
        return (x * y) / PRECISION;
    }

    /// @dev Returns x^y in percision
    /// @dev source: dsMath
    function powInPercision(uint256 x, uint256 k) internal pure returns (uint256 z) {
        z = k % 2 != 0 ? x : PRECISION;

        for (k /= 2; k != 0; k /= 2) {
            x = mulInPercision(x, x);

            if (k % 2 != 0) {
                z = mulInPercision(z, x);
            }
        }
    }

    /// @dev Returns x^y in percision
    /// Assume that x < PRECISION, so this can not overflow
    function unsafePowInPercision(uint256 x, uint256 k) internal pure returns (uint256 z) {
        z = k % 2 != 0 ? x : PRECISION;

        for (k /= 2; k != 0; k /= 2) {
            x = unsafeMulInPercision(x, x);

            if (k % 2 != 0) {
                z = unsafeMulInPercision(z, x);
            }
        }
    }
}
