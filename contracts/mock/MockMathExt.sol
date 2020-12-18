pragma solidity 0.6.6;

import "../libraries/MathExt.sol";

contract MockMathExt {
    using MathExt for uint256;

    function mulInPrecision(uint256 x, uint256 y) external pure returns (uint256) {
        return x.mulInPrecision(y);
    }

    function powInPrecision(uint256 x, uint256 k) external pure returns (uint256) {
        return x.unsafePowInPrecision(k);
    }

    function sqrt(uint256 x) external pure returns (uint256) {
        return x.sqrt();
    }
}
