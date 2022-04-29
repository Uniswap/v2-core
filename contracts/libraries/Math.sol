pragma solidity ^0.8.0;

library Math {
  function min(uint256 x, uint256 y) internal pure returns (uint256 z) {
    z = x < y ? x : y;
  }

  function max(uint256 x, uint256 y) internal pure returns (uint256 z) {
    z = x > y ? x : y;
  }

  function add(uint256 x, uint256 y) internal pure returns (uint256 z) {
    z = x + y;
  }

  function sub(uint256 x, uint256 y) internal pure returns (uint256 z) {
    z = x - y;
  }

  function mul(uint256 x, uint256 y) internal pure returns (uint256 z) {
    z = x * y;
  }

  function div(uint256 x, uint256 y) internal pure returns (uint256 z) {
    require(y != 0);
    z = x / y;
  }

  function pow(uint256 x, uint256 y) internal pure returns (uint256 z) {
    z = x**y;
  }

  // Babylonian method (https://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Babylonian_method)
  function sqrt(uint256 y) internal pure returns (uint256 z) {
    if (y > 3) {
      z = y;
      uint256 x = y / 2 + 1;
      while (x < z) {
        z = x;
        x = (y / x + x) / 2;
      }
    } else if (y != 0) {
      z = 1;
    }
  }
}
