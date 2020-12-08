// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./IXYZSwapExchangeRouter.sol";
import "./IXYZSwapLiquidityRouter.sol";

/// @dev full interface for router
interface IXYZSwapRouter is IXYZSwapExchangeRouter, IXYZSwapLiquidityRouter {
    /// @dev Deprecated using addLiquidity with ETH_ADDRESS for simple API
    function addLiquidityETH(
        IERC20 token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    )
        external
        payable
        returns (
            uint256 amountToken,
            uint256 amountETH,
            uint256 liquidity
        );

    /// @dev Deprecated using removeLiquidity with ETH_ADDRESS for simple API
    function removeLiquidityETH(
        IERC20 token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountToken, uint256 amountETH);

    /// @dev Deprecated using removeLiquidityWithPermit with ETH_ADDRESS for simple API
    function removeLiquidityETHWithPermit(
        IERC20 token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline,
        bool approveMax,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (uint256 amountToken, uint256 amountETH);

    /// @dev Deprecated using swapExactTokensForTokens with ETH_ADDRESS for simple API
    function swapExactETHForTokens(
        uint256 amountOutMin,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    /// @dev Deprecated using swapTokensForExactTokens with ETH_ADDRESS for simple API
    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    /// @dev Deprecated using swapExactTokensForTokens with ETH_ADDRESS for simple API
    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    /// @dev Deprecated using swapTokensForExactTokens with ETH_ADDRESS for simple API
    function swapETHForExactTokens(
        uint256 amountOut,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    function factory() external pure returns (address);

    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 fee
    ) external pure returns (uint256 amountOut);

    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 fee
    ) external pure returns (uint256 amountIn);
}
