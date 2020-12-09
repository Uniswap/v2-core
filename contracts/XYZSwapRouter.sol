// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./interfaces/IXYZSwapFactory.sol";
import "./interfaces/IXYZSwapRouter.sol";
import "./interfaces/IXYZSwapPair.sol";
import "./interfaces/IERC20Permit.sol";

import "./libraries/XYZSwapLibrary.sol";
import "./libraries/UniERC20.sol";

contract XYZSwapRouter01 is IXYZSwapRouter {
    using UniERC20 for IERC20;
    using UniERC20 for IXYZSwapPair;

    IERC20 public constant ETH_ADDRESS = IERC20(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);

    address public immutable override factory;

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "XYZSwapRouter: EXPIRED");
        _;
    }

    constructor(address _factory) public {
        factory = _factory;
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
        public
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

        tokenA.uniTransferFromSender(pair, amountA);
        tokenB.uniTransferFromSender(pair, amountB);
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
        returns (
            uint256 amountToken,
            uint256 amountETH,
            uint256 liquidity
        )
    {
        (amountToken, amountETH, liquidity) = addLiquidity(
            token,
            ETH_ADDRESS,
            amountTokenDesired,
            msg.value,
            amountTokenMin,
            amountETHMin,
            to,
            deadline
        );
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
        IERC20(pair).uniTransferFromSender(pair, liquidity); // send liquidity to pair
        (uint256 amount0, uint256 amount1) = IXYZSwapPair(pair).burn(to);
        (IERC20 token0, ) = XYZSwapLibrary.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        //TODO: this safe check should put at the start of the function
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
    ) external override returns (uint256 amountToken, uint256 amountETH) {
        (amountToken, amountETH) = removeLiquidity(
            token,
            ETH_ADDRESS,
            liquidity,
            amountTokenMin,
            amountETHMin,
            to,
            deadline
        );
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
    ) public override returns (uint256 amountA, uint256 amountB) {
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
        (amountToken, amountETH) = removeLiquidityWithPermit(
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
        IERC20[] memory path,
        address to,
        uint256 deadline
    ) public override payable ensure(deadline) returns (uint256[] memory amounts) {
        amounts = XYZSwapLibrary.getAmountsOut(factory, amountIn, path);
        require(
            amounts[amounts.length - 1] >= amountOutMin,
            "XYZSwapRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );
        path[0].uniTransferFromSender(
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
        path[0].uniTransferFromSender(
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
    ) external override payable returns (uint256[] memory amounts) {
        require(path[0] == ETH_ADDRESS, "XYZSwapRouter: INVALID_PATH");
        amounts = swapExactTokensForTokens(msg.value, amountOutMin, path, to, deadline);
    }

    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external override returns (uint256[] memory amounts) {
        require(path[path.length - 1] == ETH_ADDRESS, "XYZSwapRouter: INVALID_PATH");
        amounts = swapTokensForExactTokens(amountOut, amountInMax, path, to, deadline);
    }

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external override returns (uint256[] memory amounts) {
        require(path[path.length - 1] == ETH_ADDRESS, "XYZSwapRouter: INVALID_PATH");
        amounts = swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline);
    }

    function swapETHForExactTokens(
        uint256 amountOut,
        IERC20[] calldata path,
        address to,
        uint256 deadline
    ) external override payable returns (uint256[] memory amounts) {
        require(path[0] == ETH_ADDRESS, "XYZSwapRouter: INVALID_PATH");
        amounts = swapTokensForExactTokens(amountOut, msg.value, path, to, deadline);
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
