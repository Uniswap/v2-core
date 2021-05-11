// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.4.0;

import '../libraries/Babylonian.sol';

contract BabylonianEchidnaTest {
    function checkSqrt(uint256 input) public pure {
        uint256 sqrt = Babylonian.sqrt(input);

        assert(sqrt < 2**128); // 2**128 == sqrt(2^256)
        // since we compute floor(sqrt(input))
        assert(sqrt**2 <= input);
        assert((sqrt + 1)**2 > input || sqrt == uint128(-1));
    }

    function checkMaxForIndex(uint8 index) external pure {
        checkSqrt(index == 255 ? uint256(-1) : uint256(2)**(index + 1));
    }
}
