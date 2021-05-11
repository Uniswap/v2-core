// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.5.0;

import '../libraries/BitMath.sol';

contract BitMathTest {
    function mostSignificantBit(uint256 x) external pure returns (uint8 r) {
        return BitMath.mostSignificantBit(x);
    }

    function getGasCostOfMostSignificantBit(uint256 x) external view returns (uint256) {
        uint256 gasBefore = gasleft();
        BitMath.mostSignificantBit(x);
        return gasBefore - gasleft();
    }

    function leastSignificantBit(uint256 x) external pure returns (uint8 r) {
        return BitMath.leastSignificantBit(x);
    }

    function getGasCostOfLeastSignificantBit(uint256 x) external view returns (uint256) {
        uint256 gasBefore = gasleft();
        BitMath.leastSignificantBit(x);
        return gasBefore - gasleft();
    }
}
