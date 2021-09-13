pragma solidity =0.5.16;

import '../UnifarmERC20.sol';

contract ERC20 is UnifarmERC20 {
    constructor(uint _totalSupply) public {
        _mint(msg.sender, _totalSupply);
    }
}
