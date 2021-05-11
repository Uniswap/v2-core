// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.4.0;

import '../libraries/FullMath.sol';

contract FullMathTest {
    function mulDiv(
        uint256 x,
        uint256 y,
        uint256 z
    ) external pure returns (uint256) {
        return FullMath.mulDiv(x, y, z);
    }

    function mulDivRoundingUp(
        uint256 x,
        uint256 y,
        uint256 z
    ) external pure returns (uint256) {
        bool roundUp = mulmod(x, y, z) > 0;
        return FullMath.mulDiv(x, y, z) + (roundUp ? 1 : 0);
    }
}
