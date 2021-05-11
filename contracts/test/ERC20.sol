// SPDX-License-Identifier: GPL-3.0

pragma solidity=0.6.12;

import '../DeliciouswapERC20.sol';

contract ERC20 is DeliciouswapERC20 {
    constructor(uint _totalSupply) public {
        _mint(msg.sender, _totalSupply);
    }
}
