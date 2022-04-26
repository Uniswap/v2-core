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
  function sqrt(uint256 x) internal pure returns (uint256 y) {
    uint256 _x = x;
    uint256 _y = 1;

    while (_x - _y > uint256(0)) {
      _x = (_x + _y) / 2;
      _y = x / _x;
    }
    y = _x;
  }
}
