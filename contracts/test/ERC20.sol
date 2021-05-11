pragma solidity =0.5.16;

import '../DeliciouswapERC20.sol';

contract ERC20 is DeliciouswapERC20 {
    constructor(uint _totalSupply) public {
        _mint(msg.sender, _totalSupply);
    }
}
