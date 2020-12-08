pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";

import "./XYZSwapRouter.sol";
import "./interfaces/IXYZSwapRouterv2.sol";

contract XYZSwapRouterv2 is XYZSwapRouter01, IXYZSwapRouterv2 {
    using SafeMath for uint256;

    constructor(address _factory) public XYZSwapRouter01(_factory) {}

    /// @dev Deprecated using removeLiquidity for simple API
    /// @dev because we can remove liquidity directly to dest Address
    /// @dev so this would be ok for FeeOnTransfer token
    function removeLiquidityETHSupportingFeeOnTransferTokens(
        IERC20 token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external override returns (uint256 amountETH) {
        (, amountETH) = removeLiquidity(
            token,
            ETH_ADDRESS,
            liquidity,
            amountTokenMin,
            amountETHMin,
            to,
            deadline
        );
    }

    /// @dev Deprecated using removeLiquidity for simple API
    /// @dev because we can remove liquidity directly to dest Address
    /// @dev so this would be ok for FeeOnTransfer token
    function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
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
    ) external override returns (uint256 amountETH) {
        (, amountETH) = removeLiquidityWithPermit(
            token,
            ETH_ADDRESS,
            liquidity,
            amountTokenMin,
            amountETHMin,
            to,
            deadline,
            approveMax,
            v,
            r,
            s
        );
    }

    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint256 amountOutMin,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external override payable {
        require(path[0] == ETH_ADDRESS, "XYZSwapRouter: INVALID_PATH");
        swapExactTokensForTokensSupportingFeeOnTransferTokens(
            msg.value,
            amountOutMin,
            path,
            to,
            deadline
        );
    }

    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external override {
        require(path[path.length - 1] == ETH_ADDRESS, "XYZSwapRouter: INVALID_PATH");
        swapExactTokensForTokensSupportingFeeOnTransferTokens(
            amountIn,
            amountOutMin,
            path,
            to,
            deadline
        );
    }

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        IERC20[] memory path,
        address to,
        uint256 deadline
    ) public override ensure(deadline) {
        path[0].uniTransferFromSender(XYZSwapLibrary.pairFor(factory, path[0], path[1]), amountIn);
        uint256 balanceBefore = path[path.length - 1].uniBalanceOf(to);
        _swapSupportingFeeOnTransferTokens(path, to);
        uint256 balanceAfter = path[path.length - 1].uniBalanceOf(to);
        require(
            balanceAfter >= balanceBefore.add(amountOutMin),
            "XYZSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );
    }

    // **** SWAP (supporting fee-on-transfer tokens) ****
    // requires the initial amount to have already been sent to the first pair
    function _swapSupportingFeeOnTransferTokens(IERC20[] memory path, address _to) internal {
        for (uint256 i; i < path.length - 1; i++) {
            (IERC20 input, IERC20 output) = (path[i], path[i + 1]);
            (IERC20 token0, ) = XYZSwapLibrary.sortTokens(input, output);
            IXYZSwapPair pair = IXYZSwapPair(XYZSwapLibrary.pairFor(factory, input, output));
            uint256 amountInput;
            uint256 amountOutput;
            {
                // scope to avoid stack too deep errors
                (uint256 reserve0, uint256 reserve1, uint256 fee) = pair.getTradeInfo();
                (uint256 reserveInput, uint256 reserveOutput) = input == token0
                    ? (reserve0, reserve1)
                    : (reserve1, reserve0);
                amountInput = IERC20(input).uniBalanceOf(address(pair)).sub(reserveInput);
                amountOutput = XYZSwapLibrary.getAmountOut(
                    amountInput,
                    reserveInput,
                    reserveOutput,
                    fee
                );
            }
            (uint256 amount0Out, uint256 amount1Out) = input == token0
                ? (uint256(0), amountOutput)
                : (amountOutput, uint256(0));
            address to = i < path.length - 2
                ? XYZSwapLibrary.pairFor(factory, output, path[i + 2])
                : _to;
            pair.swap(amount0Out, amount1Out, to, new bytes(0));
        }
    }
}
