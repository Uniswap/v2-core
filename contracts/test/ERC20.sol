pragma solidity ^0.8.0;

import '../QuasarERC20.sol';

contract TestERC20 is QuasarERC20 {
  constructor(uint256 _totalSupply) {
    _mint(_msgSender(), _totalSupply);
  }
}
