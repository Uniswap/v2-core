// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./IWETH.sol";
import "./IKSExchangeRouter.sol";
import "./IKSLiquidityRouter.sol";

/// @dev full interface for router
interface IKSRouter01 is IKSExchangeRouter, IKSLiquidityRouter {
    function factory() external pure returns (address);

    function weth() external pure returns (IWETH);
}
