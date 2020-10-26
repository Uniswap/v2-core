// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "../libraries/XYZSwapLibrary.sol";

contract MockXYZSwapLibrary {
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 fee
    ) external pure returns (uint256 amountOut) {
        return XYZSwapLibrary.getAmountOut(amountIn, reserveIn, reserveOut, fee);
    }

    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 fee
    ) external pure returns (uint256 amountIn) {
        return XYZSwapLibrary.getAmountIn(amountOut, reserveIn, reserveOut, fee);
    }

    function sortTokens(IERC20 tokenA, IERC20 tokenB)
        external
        pure
        returns (IERC20 token0, IERC20 token1)
    {
        return XYZSwapLibrary.sortTokens(tokenA, tokenB);
    }
}
