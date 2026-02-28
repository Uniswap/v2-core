// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

import "../interfaces/IDMMCallee.sol";
import "../interfaces/IDMMFactory.sol";
import "../interfaces/IDMMPool.sol";
import "../interfaces/IWETH.sol";
import "../libraries/DMMLibrary.sol";

contract ExampleFlashSwap is IDMMCallee {
    using SafeERC20 for IERC20;

    address public immutable factory;
    IWETH public immutable weth;
    IUniswapV2Router02 public uniswapRounter02;

    constructor(IUniswapV2Router02 _uniswapRounter02, address _factory) public {
        uniswapRounter02 = _uniswapRounter02;
        weth = IWETH(_uniswapRounter02.WETH());
        factory = _factory;
    }

    receive() external payable {}

    // gets tokens/WETH via a dmm flash swap, swaps for the WETH/tokens on uniswapV2, repays dmm, and keeps the rest!
    function dmmSwapCall(
        address sender,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) external override {
        IERC20[] memory path = new IERC20[](2);
        address[] memory path2 = new address[](2);
        address[] memory poolsPath = new address[](1);
        poolsPath[0] = msg.sender;

        uint256 amountToken;
        uint256 amountETH;
        {
            // scope for token{0,1}, avoids stack too deep errors
            IERC20 token0 = IDMMPool(msg.sender).token0();
            IERC20 token1 = IDMMPool(msg.sender).token1();
            assert(IDMMFactory(factory).isPool(token0, token1, msg.sender));
            assert(amount0 == 0 || amount1 == 0); // this strategy is unidirectional
            path[0] = amount0 == 0 ? token0 : token1;
            path[1] = amount0 == 0 ? token1 : token0;
            path2[0] = address(path[1]);
            path2[1] = address(path[0]);

            amountToken = token0 == IERC20(weth) ? amount1 : amount0;
            amountETH = token0 == IERC20(weth) ? amount0 : amount1;
        }
        assert(path[0] == IERC20(weth) || path[1] == IERC20(weth)); // this strategy only works with a V2 WETH pool

        if (amountToken > 0) {
            uint256 minETH = abi.decode(data, (uint256)); // slippage parameter for V1, passed in by caller
            uint256 amountRequired = DMMLibrary.getAmountsIn(amountToken, poolsPath, path)[0];
            path[1].safeApprove(address(uniswapRounter02), amountToken);
            uint256[] memory amounts = uniswapRounter02.swapExactTokensForTokens(
                amountToken,
                minETH,
                path2,
                address(this),
                uint256(-1)
            );
            uint256 amountReceived = amounts[amounts.length - 1];
            assert(amountReceived > amountRequired); // fail if we didn't get enough ETH back to repay our flash loan

            weth.transfer(msg.sender, amountRequired);
            weth.withdraw(amountReceived - amountRequired);
            (bool success, ) = sender.call{value: amountReceived - amountRequired}(new bytes(0));
            require(success, "transfer eth failed");
        } else {
            weth.withdraw(amountETH);
            uint256 amountRequired = DMMLibrary.getAmountsIn(amountETH, poolsPath, path)[0];
            uint256[] memory amounts = uniswapRounter02.swapETHForExactTokens{value: amountETH}(
                amountRequired,
                path2,
                address(this),
                uint256(-1)
            );

            path[0].safeTransfer(msg.sender, amountRequired);
            assert(amountETH > amounts[0]); // fail if we didn't get enough tokens back to repay our flash loan
            (bool success, ) = sender.call{value: amountETH - amounts[0]}(new bytes(0));
            require(success, "transfer eth failed");
        }
    }
}
