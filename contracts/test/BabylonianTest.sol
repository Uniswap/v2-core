// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.4.0;

import '../libraries/Babylonian.sol';

contract BabylonianTest {
    function sqrt(uint256 num) external pure returns (uint256) {
        return Babylonian.sqrt(num);
    }

    function getGasCostOfSqrt(uint256 num) external view returns (uint256) {
        uint256 gasBefore = gasleft();
        Babylonian.sqrt(num);
        return gasBefore - gasleft();
    }
}
