pragma solidity ^0.8.0;

import '../libraries/Math.sol';

contract MathTest {
  function squareRoot(uint256 x) external pure returns (uint256) {
    return Math.sqrt(x);
  }
}
