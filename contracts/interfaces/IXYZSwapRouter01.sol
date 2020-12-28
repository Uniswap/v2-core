pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./IXYZSwapExchangeRouter.sol";
import "./IXYZSwapLiquidityRouter.sol";

/// @dev full interface for router
interface IXYZSwapRouter01 is IXYZSwapExchangeRouter, IXYZSwapLiquidityRouter {
    function factory() external pure returns (address);

    function weth() external pure returns (address);

    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 feeInPrecision
    ) external pure returns (uint256 amountOut);

    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 feeInPrecision
    ) external pure returns (uint256 amountIn);
}
