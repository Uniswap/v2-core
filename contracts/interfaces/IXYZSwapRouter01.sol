pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./IWETH.sol";
import "./IXYZSwapExchangeRouter.sol";
import "./IXYZSwapLiquidityRouter.sol";

/// @dev full interface for router
interface IXYZSwapRouter01 is IXYZSwapExchangeRouter, IXYZSwapLiquidityRouter {
    function factory() external pure returns (address);

    function weth() external pure returns (IWETH);
}
