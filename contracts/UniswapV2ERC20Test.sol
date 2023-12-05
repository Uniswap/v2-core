pragma solidity =0.5.16;

import "./UniswapV2ERC20.sol";

contract UniswapV2ERC20Test is UniswapV2ERC20 {
    function mint(address to, uint value) public {
        _mint(to, value);
    }
}
