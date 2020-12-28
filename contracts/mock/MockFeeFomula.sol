pragma solidity 0.6.6;

import "../libraries/FeeFomula.sol";

contract MockFeeFomula {
    function getFee(uint256 rFactor) external pure returns (uint256) {
        return FeeFomula.getFee(rFactor);
    }
}
