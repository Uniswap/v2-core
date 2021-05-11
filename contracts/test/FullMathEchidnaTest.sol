// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.4.0;

import '../libraries/FullMath.sol';

contract FullMathEchidnaTest {
    function checkH(uint256 x, uint256 y) public pure {
        // if the mul doesn't overflow in 256-bit space, h should be 0
        if (x == 0 || ((x * y) / x == y)) {
            (, uint256 h) = FullMath.fullMul(x, y);
            assert(h == 0);
        }
    }
}
