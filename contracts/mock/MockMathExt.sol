// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "../libraries/MathExt.sol";

contract MockMathExt {
    using MathExt for uint256;

    function mulInPrecision(uint256 x, uint256 y) external pure returns (uint256) {
        return x.mulInPercision(y);
    }

    function powInPercision(uint256 x, uint256 k) external pure returns (uint256) {
        return x.unsafePowInPercision(k);
    }
}
