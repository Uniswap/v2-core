pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract TestERC20 is ERC20 {
  constructor(uint256 _totalSupply) ERC20('Test Token', 'TT') {
    _mint(_msgSender(), _totalSupply);
  }
}
