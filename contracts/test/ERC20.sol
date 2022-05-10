pragma solidity =0.5.16;

import '../EtcswapV2ERC20.sol';

contract ERC20 is EtcswapV2ERC20 {
    constructor(uint _totalSupply) public {
        _mint(msg.sender, _totalSupply);
    }
}
