pragma solidity >=0.5.0;

interface IEtcswapV2Callee {
    function etcswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external;
}
