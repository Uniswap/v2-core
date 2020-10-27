// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./interfaces/IXYZSwapFactory.sol";
import "./interfaces/IXYZSwapRouter.sol";
import "./interfaces/IXYZSwapPair.sol";

import "./libraries/XYZSwapLibrary.sol";
import "./interfaces/IWETH.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract XYZSwapRouter01 is IXYZSwapRouter {
    using SafeERC20 for IERC20;
    using SafeERC20 for IXYZSwapPair;

    address public immutable override factory;
    IERC20 public immutable override WETH;

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "XYZSwapRouter: EXPIRED");
        _;
    }

    constructor(address _factory, IERC20 _WETH) public {
        factory = _factory;
        WETH = _WETH;
    }

    receive() external payable {
        assert(msg.sender == address(WETH)); // only accept ETH via fallback from the WETH contract
    }

    // **** ADD LIQUIDITY ****
    function _addLiquidity(
        IERC20 tokenA,
        IERC20 tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) private returns (uint256 amountA, uint256 amountB) {
        // create the pair if it doesn't exist yet
        address pair = IXYZSwapFactory(factory).getPair(tokenA, tokenB);
        if (pair == address(0)) {
            pair = IXYZSwapFactory(factory).createPair(tokenA, tokenB);
        }
        (uint256 reserveA, uint256 reserveB, ) = IXYZSwapPair(pair).getReserves();
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
        override
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
            WETH,
            amountTokenDesired,
            msg.value,
            amountTokenMin,
            amountETHMin
        );

        address pair = XYZSwapLibrary.pairFor(factory, token, WETH);
        IERC20(token).safeTransferFrom(msg.sender, pair, amountToken);
        IWETH(address(WETH)).deposit{value: amountETH}();
        assert(IWETH(address(WETH)).transfer(pair, amountETH));
        liquidity = IXYZSwapPair(pair).mint(to);
        if (msg.value > amountETH) {
            (bool success, ) = msg.sender.call{value: msg.value - amountETH}(new bytes(0));
            require(success);
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
            WETH,
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        IERC20(token).safeTransfer(to, amountToken);
        IWETH(address(WETH)).withdraw(amountETH);
        (bool success, ) = to.call{value: amountETH}(new bytes(0));
        require(success);
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
            IXYZSwapPair(XYZSwapLibrary.pairFor(factory, input, output)).swap(
                amount0Out,
                amount1Out,
                to,
                new bytes(0)
            );
        }
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external override ensure(deadline) returns (uint256[] memory amounts) {
        amounts = XYZSwapLibrary.getAmountsOut(factory, amountIn, path);
        require(
            amounts[amounts.length - 1] >= amountOutMin,
            "XYZSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );
        IERC20(path[0]).safeTransferFrom(
            msg.sender,
            XYZSwapLibrary.pairFor(factory, path[0], path[1]),
            amounts[0]
        );
        _swap(amounts, path, to);
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external override ensure(deadline) returns (uint256[] memory amounts) {
        amounts = XYZSwapLibrary.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, "XYZSwapRouter: EXCESSIVE_INPUT_AMOUNT");
        IERC20(path[0]).safeTransferFrom(
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
        require(path[0] == WETH, "XYZSwapRouter: INVALID_PATH");
        amounts = XYZSwapLibrary.getAmountsOut(factory, msg.value, path);
        require(
            amounts[amounts.length - 1] >= amountOutMin,
            "XYZSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );
        IWETH(address(WETH)).deposit{value: amounts[0]}();
        assert(
            IWETH(address(WETH)).transfer(
                XYZSwapLibrary.pairFor(factory, path[0], path[1]),
                amounts[0]
            )
        );
        _swap(amounts, path, to);
    }

    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external override ensure(deadline) returns (uint256[] memory amounts) {
        require(path[path.length - 1] == WETH, "XYZSwapRouter: INVALID_PATH");
        amounts = XYZSwapLibrary.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, "XYZSwapRouter: EXCESSIVE_INPUT_AMOUNT");
        IERC20(path[0]).safeTransferFrom(
            msg.sender,
            XYZSwapLibrary.pairFor(factory, path[0], path[1]),
            amounts[0]
        );
        _swap(amounts, path, address(this));
        IWETH(address(WETH)).withdraw(amounts[amounts.length - 1]);
        (bool success, ) = to.call{value: amounts[amounts.length - 1]}(new bytes(0));
        require(success);
    }

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external override ensure(deadline) returns (uint256[] memory amounts) {
        require(path[path.length - 1] == WETH, "XYZSwapRouter: INVALID_PATH");
        amounts = XYZSwapLibrary.getAmountsOut(factory, amountIn, path);
        require(
            amounts[amounts.length - 1] >= amountOutMin,
            "XYZSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );
        IERC20(path[0]).safeTransferFrom(
            msg.sender,
            XYZSwapLibrary.pairFor(factory, path[0], path[1]),
            amounts[0]
        );
        _swap(amounts, path, address(this));
        IWETH(address(WETH)).withdraw(amounts[amounts.length - 1]);
        (bool success, ) = to.call{value: amounts[amounts.length - 1]}(new bytes(0));
        require(success);
    }

    function swapETHForExactTokens(
        uint256 amountOut,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external override payable ensure(deadline) returns (uint256[] memory amounts) {
        require(path[0] == WETH, "XYZSwapRouter: INVALID_PATH");
        amounts = XYZSwapLibrary.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= msg.value, "XYZSwapRouter: EXCESSIVE_INPUT_AMOUNT");
        IWETH(address(WETH)).deposit{value: amounts[0]}();
        assert(
            IWETH(address(WETH)).transfer(
                XYZSwapLibrary.pairFor(factory, path[0], path[1]),
                amounts[0]
            )
        );
        _swap(amounts, path, to);
        if (msg.value > amounts[0]) {
            (bool success, ) = msg.sender.call{value: msg.value - amounts[0]}(new bytes(0));
            require(success);
        }
    }

    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) public override pure returns (uint256 amountB) {
        return XYZSwapLibrary.quote(amountA, reserveA, reserveB);
    }

    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 fee
    ) public override pure returns (uint256 amountOut) {
        return XYZSwapLibrary.getAmountOut(amountIn, reserveIn, reserveOut, fee);
    }

    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 fee
    ) public override pure returns (uint256 amountIn) {
        return XYZSwapLibrary.getAmountIn(amountOut, reserveIn, reserveOut, fee);
    }

    function getAmountsOut(uint256 amountIn, IERC20[] memory path)
        public
        override
        view
        returns (uint256[] memory amounts)
    {
        return XYZSwapLibrary.getAmountsOut(factory, amountIn, path);
    }

    function getAmountsIn(uint256 amountOut, IERC20[] memory path)
        public
        override
        view
        returns (uint256[] memory amounts)
    {
        return XYZSwapLibrary.getAmountsIn(factory, amountOut, path);
    }
}
