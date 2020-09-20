pragma solidity =0.5.16;

import '../TWSwapERC20.sol';

contract ERC20 is TWSwapERC20 {
    constructor(uint _totalSupply) public {
        _mint(msg.sender, _totalSupply);
    }
}
