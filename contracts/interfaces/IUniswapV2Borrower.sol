pragma solidity =0.5.16;

interface IUniswapV2Borrower {
    function uniswap(address from, uint amount0, uint amount1, bytes calldata data) external;
}
