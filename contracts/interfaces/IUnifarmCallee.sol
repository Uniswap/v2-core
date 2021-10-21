// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.5.16;

interface IUnifarmCallee {
    function unifarmCall(address sender, uint amount0, uint amount1, bytes calldata data) external;
}
