pragma solidity ^0.6.0;

import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "./interfaces/IXYZSwapFactory.sol";
import "./interfaces/IXYZSwapRouter02.sol";
import "./interfaces/IERC20Permit.sol";
import "./interfaces/IXYZSwapPair.sol";
import "./interfaces/IWETH.sol";
import "./libraries/XYZSwapLibrary.sol";

contract XYZSwapRouter02 is IXYZSwapRouter02 {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public immutable override factory;
    address public immutable override weth;

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "XYZSwapRouter: EXPIRED");
        _;
    }

    constructor(address _factory, address _weth) public {
        factory = _factory;
        weth = _weth;
    }

    receive() external payable {
        assert(msg.sender == weth); // only accept ETH via fallback from the WETH contract
    }

    // **** ADD LIQUIDITY ****
    function _addLiquidity(
        IERC20 tokenA,
        IERC20 tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal virtual returns (uint256 amountA, uint256 amountB) {
        // create the pair if it doesn't exist yet
        if (IXYZSwapFactory(factory).getPair(tokenA, tokenB) == address(0)) {
            IXYZSwapFactory(factory).createPair(tokenA, tokenB);
        }
        (uint256 reserveA, uint256 reserveB) = XYZSwapLibrary.getReserves(factory, tokenA, tokenB);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = XYZSwapLibrary.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "XYZSwapRouter: INSUFFICIENT_B_AMOUNT");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = XYZSwapLibrary.quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, "XYZSwapRouter: INSUFFICIENT_A_AMOUNT");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    function addLiquidity(
        IERC20 tokenA,
        IERC20 tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        virtual
        override
        payable
        ensure(deadline)
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        )
    {
        (amountA, amountB) = _addLiquidity(
            tokenA,
            tokenB,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin
        );
        address pair = XYZSwapLibrary.pairFor(factory, tokenA, tokenB);
        // using tokenA.safeTransferFrom will get "Stack too deep"
        SafeERC20.safeTransferFrom(tokenA, msg.sender, pair, amountA);
        SafeERC20.safeTransferFrom(tokenB, msg.sender, pair, amountB);
        liquidity = IXYZSwapPair(pair).mint(to);
    }

    function addLiquidityETH(
        IERC20 token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    )
        external
        override
        payable
        ensure(deadline)
        returns (
            uint256 amountToken,
            uint256 amountETH,
            uint256 liquidity
        )
    {
        (amountToken, amountETH) = _addLiquidity(
            token,
            IERC20(weth),
            amountTokenDesired,
            msg.value,
            amountTokenMin,
            amountETHMin
        );
        address pair = XYZSwapLibrary.pairFor(address(factory), token, IERC20(weth));
        token.safeTransferFrom(msg.sender, pair, amountToken);
        IWETH(weth).deposit{value: amountETH}();
        IERC20(weth).safeTransfer(pair, amountETH);
        liquidity = IXYZSwapPair(pair).mint(to);
        // refund dust eth, if any
        if (msg.value > amountETH) {
            TransferHelper.safeTransferETH(msg.sender, msg.value - amountETH);
        }
    }

    // **** REMOVE LIQUIDITY ****
    function removeLiquidity(
        IERC20 tokenA,
        IERC20 tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) public override ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        address pair = XYZSwapLibrary.pairFor(factory, tokenA, tokenB);
        IERC20(pair).safeTransferFrom(msg.sender, pair, liquidity); // send liquidity to pair
        (uint256 amount0, uint256 amount1) = IXYZSwapPair(pair).burn(to);
        (IERC20 token0, ) = XYZSwapLibrary.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, "XYZSwapRouter: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "XYZSwapRouter: INSUFFICIENT_B_AMOUNT");
    }

    function removeLiquidityETH(
        IERC20 token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) public override ensure(deadline) returns (uint256 amountToken, uint256 amountETH) {
        (amountToken, amountETH) = removeLiquidity(
            token,
            IERC20(weth),
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        token.safeTransfer(to, amountToken);
        IWETH(weth).withdraw(amountETH);
        TransferHelper.safeTransferETH(to, amountETH);
    }

    function removeLiquidityWithPermit(
        IERC20 tokenA,
        IERC20 tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline,
        bool approveMax,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external virtual override returns (uint256 amountA, uint256 amountB) {
        address pair = XYZSwapLibrary.pairFor(factory, tokenA, tokenB);
        uint256 value = approveMax ? uint256(-1) : liquidity;
        IERC20Permit(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountA, amountB) = removeLiquidity(
            tokenA,
            tokenB,
            liquidity,
            amountAMin,
            amountBMin,
            to,
            deadline
        );
    }

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
    ) external override returns (uint256 amountToken, uint256 amountETH) {
        address pair = XYZSwapLibrary.pairFor(factory, token, IERC20(weth));
        uint256 value = approveMax ? uint256(-1) : liquidity;
        IERC20Permit(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        (amountToken, amountETH) = removeLiquidityETH(
            token,
            liquidity,
            amountTokenMin,
            amountETHMin,
            to,
            deadline
        );
    }

    // **** REMOVE LIQUIDITY (supporting fee-on-transfer tokens) ****
    function removeLiquidityETHSupportingFeeOnTransferTokens(
        IERC20 token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) public override ensure(deadline) returns (uint256 amountETH) {
        (, amountETH) = removeLiquidity(
            token,
            IERC20(weth),
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        token.safeTransfer(to, IERC20(token).balanceOf(address(this)));
        IWETH(weth).withdraw(amountETH);
        TransferHelper.safeTransferETH(to, amountETH);
    }

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
        address pair = XYZSwapLibrary.pairFor(factory, token, IERC20(weth));
        uint256 value = approveMax ? uint256(-1) : liquidity;
        IERC20Permit(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
        amountETH = removeLiquidityETHSupportingFeeOnTransferTokens(
            token,
            liquidity,
            amountTokenMin,
            amountETHMin,
            to,
            deadline
        );
    }

    // **** SWAP ****
    // requires the initial amount to have already been sent to the first pair
    function _swap(
        uint256[] memory amounts,
        IERC20[] memory path,
        address _to
    ) private {
        for (uint256 i; i < path.length - 1; i++) {
            (IERC20 input, IERC20 output) = (path[i], path[i + 1]);
            (IERC20 token0, ) = XYZSwapLibrary.sortTokens(input, output);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == token0
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));
            address to = i < path.length - 2
                ? XYZSwapLibrary.pairFor(factory, output, path[i + 2])
                : _to;
            address pair = XYZSwapLibrary.pairFor(factory, input, output);
            IXYZSwapPair(pair).swap(amount0Out, amount1Out, to, new bytes(0));
        }
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        IERC20[] memory path,
        address to,
        uint256 deadline
    ) public override payable ensure(deadline) returns (uint256[] memory amounts) {
        amounts = XYZSwapLibrary.getAmountsOut(factory, amountIn, path);
        require(
            amounts[amounts.length - 1] >= amountOutMin,
            "XYZSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );
        path[0].safeTransferFrom(
            msg.sender,
            XYZSwapLibrary.pairFor(factory, path[0], path[1]),
            amounts[0]
        );
        _swap(amounts, path, to);
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        IERC20[] memory path,
        address to,
        uint256 deadline
    ) public override payable ensure(deadline) returns (uint256[] memory amounts) {
        amounts = XYZSwapLibrary.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, "XYZSwapRouter: EXCESSIVE_INPUT_AMOUNT");
        path[0].safeTransferFrom(
            msg.sender,
            XYZSwapLibrary.pairFor(factory, path[0], path[1]),
            amounts[0]
        );
        _swap(amounts, path, to);
    }

    function swapExactETHForTokens(
        uint256 amountOutMin,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external override payable ensure(deadline) returns (uint256[] memory amounts) {
        require(path[0] == IERC20(weth), "XYZSwapRouter: INVALID_PATH");
        amounts = XYZSwapLibrary.getAmountsOut(factory, msg.value, path);
        require(
            amounts[amounts.length - 1] >= amountOutMin,
            "XYZSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );
        IWETH(weth).deposit{value: amounts[0]}();
        IERC20(weth).safeTransfer(XYZSwapLibrary.pairFor(factory, path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
    }

    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external override ensure(deadline) returns (uint256[] memory amounts) {
        require(path[path.length - 1] == IERC20(weth), "XYZSwapRouter: INVALID_PATH");
        amounts = XYZSwapLibrary.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, "XYZSwapRouter: EXCESSIVE_INPUT_AMOUNT");
        path[0].safeTransferFrom(
            msg.sender,
            XYZSwapLibrary.pairFor(factory, path[0], path[1]),
            amounts[0]
        );
        _swap(amounts, path, address(this));
        IWETH(weth).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
    }

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external override ensure(deadline) returns (uint256[] memory amounts) {
        require(path[path.length - 1] == IERC20(weth), "XYZSwapRouter: INVALID_PATH");
        amounts = XYZSwapLibrary.getAmountsOut(factory, amountIn, path);
        require(
            amounts[amounts.length - 1] >= amountOutMin,
            "XYZSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );
        path[0].safeTransferFrom(
            msg.sender,
            XYZSwapLibrary.pairFor(factory, path[0], path[1]),
            amounts[0]
        );
        _swap(amounts, path, address(this));
        IWETH(weth).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
    }

    function swapETHForExactTokens(
        uint256 amountOut,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external override payable ensure(deadline) returns (uint256[] memory amounts) {
        require(path[0] == IERC20(weth), "XYZSwapRouter: INVALID_PATH");
        amounts = XYZSwapLibrary.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= msg.value, "XYZSwapRouter: EXCESSIVE_INPUT_AMOUNT");
        IWETH(weth).deposit{value: amounts[0]}();
        IERC20(weth).safeTransfer(XYZSwapLibrary.pairFor(factory, path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
        // refund dust eth, if any
        if (msg.value > amounts[0]) {
            TransferHelper.safeTransferETH(msg.sender, msg.value - amounts[0]);
        }
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
                amountInput = IERC20(input).balanceOf(address(pair)).sub(reserveInput);
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

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        IERC20[] memory path,
        address to,
        uint256 deadline
    ) public override ensure(deadline) {
        path[0].safeTransferFrom(
            msg.sender,
            XYZSwapLibrary.pairFor(factory, path[0], path[1]),
            amountIn
        );
        uint256 balanceBefore = path[path.length - 1].balanceOf(to);
        _swapSupportingFeeOnTransferTokens(path, to);
        uint256 balanceAfter = path[path.length - 1].balanceOf(to);
        require(
            balanceAfter >= balanceBefore.add(amountOutMin),
            "XYZSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );
    }

    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint256 amountOutMin,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external override payable ensure(deadline) {
        require(path[0] == IERC20(weth), "XYZSwapRouter: INVALID_PATH");
        uint256 amountIn = msg.value;
        IWETH(weth).deposit{value: amountIn}();
        IERC20(weth).safeTransfer(XYZSwapLibrary.pairFor(factory, path[0], path[1]), amountIn);
        uint256 balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
        _swapSupportingFeeOnTransferTokens(path, to);
        require(
            path[path.length - 1].balanceOf(to).sub(balanceBefore) >= amountOutMin,
            "XYZSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );
    }

    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external override ensure(deadline) {
        require(path[path.length - 1] == IERC20(weth), "XYZSwapRouter: INVALID_PATH");
        path[0].safeTransferFrom(
            msg.sender,
            XYZSwapLibrary.pairFor(factory, path[0], path[1]),
            amountIn
        );
        _swapSupportingFeeOnTransferTokens(path, address(this));
        uint256 amountOut = IWETH(weth).balanceOf(address(this));
        require(amountOut >= amountOutMin, "UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT");
        IWETH(weth).withdraw(amountOut);
        TransferHelper.safeTransferETH(to, amountOut);
    }

    // **** LIBRARY FUNCTIONS ****

    /// @dev get the amount of tokenB for adding liquidity with given amount of token A and the amount of tokens in the pair
    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) external override pure returns (uint256 amountB) {
        return XYZSwapLibrary.quote(amountA, reserveA, reserveB);
    }

    /// @dev reserveIn, reserveOut and feeInPrecision are fetched by getTradeInfo API
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 feeInPrecision
    ) external override pure returns (uint256 amountOut) {
        return XYZSwapLibrary.getAmountOut(amountIn, reserveIn, reserveOut, feeInPrecision);
    }

    /// @dev reserveIn, reserveOut and feeInPrecision are fetched by getTradeInfo API
    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 feeInPrecision
    ) external override pure returns (uint256 amountIn) {
        return XYZSwapLibrary.getAmountIn(amountOut, reserveIn, reserveOut, feeInPrecision);
    }

    function getAmountsOut(uint256 amountIn, IERC20[] calldata path)
        external
        override
        view
        returns (uint256[] memory amounts)
    {
        return XYZSwapLibrary.getAmountsOut(factory, amountIn, path);
    }

    function getAmountsIn(uint256 amountOut, IERC20[] calldata path)
        external
        override
        view
        returns (uint256[] memory amounts)
    {
        return XYZSwapLibrary.getAmountsIn(factory, amountOut, path);
    }
}
