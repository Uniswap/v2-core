pragma solidity =0.5.16;

interface IUniswapCallback {
    function uniswapCallback(bytes calldata callbackData) external;
}
