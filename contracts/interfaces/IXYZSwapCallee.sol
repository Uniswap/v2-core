// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

interface IXYZSwapCallee {
    function xyzSwapCall(
        address sender,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) external;
}
