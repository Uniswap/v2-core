// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "../interfaces/IXYZSwapPair.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library XYZSwapLibrary {
    using SafeMath for uint256;

    uint256 public constant PRECISION = (10**18);

    // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sortTokens(IERC20 tokenA, IERC20 tokenB)
        internal
        pure
        returns (IERC20 token0, IERC20 token1)
    {
        require(tokenA != tokenB, "XYZSwapLibrary: IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(address(token0) != address(0), "XYZSwapLibrary: ZERO_ADDRESS");
    }

    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(
        address factory,
        IERC20 tokenA,
        IERC20 tokenB
    ) internal pure returns (address pair) {
        (IERC20 token0, IERC20 token1) = sortTokens(tokenA, tokenB);
        pair = address(
            uint256(
                keccak256(
                    abi.encodePacked(
                        hex"ff",
                        factory,
                        keccak256(abi.encodePacked(token0, token1)),
                        hex"6a5184855ab2956af33fbeeb7891bf9cafd924d611e98c61c195eab024920b11" // init code hash
                    )
                )
            )
        );
    }

    // fetches and sorts the reserves for a pair
    function getTradeInfo(
        address factory,
        IERC20 tokenA,
        IERC20 tokenB
    )
        internal
        view
        returns (
            uint256 reserveA,
            uint256 reserveB,
            uint256 fee
        )
    {
        (IERC20 token0, ) = sortTokens(tokenA, tokenB);
        (reserveA, reserveB, fee) = IXYZSwapPair(pairFor(factory, tokenA, tokenB)).getTradeInfo();
        (reserveA, reserveB) = tokenA == token0 ? (reserveA, reserveB) : (reserveB, reserveA);
    }

    // given some amount of an asset and pair reserves, returns an equivalent amount of the other asset
    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) internal pure returns (uint256 amountB) {
        require(amountA > 0, "XYZSwapLibrary: INSUFFICIENT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "XYZSwapLibrary: INSUFFICIENT_LIQUIDITY");
        amountB = amountA.mul(reserveB) / reserveA;
    }

    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 fee
    ) internal pure returns (uint256 amountOut) {
        require(amountIn > 0, "XYZSwapLibrary: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "XYZSwapLibrary: INSUFFICIENT_LIQUIDITY");
        uint256 amountInWithFee = amountIn.mul(PRECISION - fee).div(PRECISION);
        uint256 numerator = amountInWithFee.mul(reserveOut);
        uint256 denominator = reserveIn.add(amountInWithFee);
        amountOut = numerator / denominator;
    }

    // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 fee
    ) internal pure returns (uint256 amountIn) {
        require(amountOut > 0, "XYZSwapLibrary: INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "XYZSwapLibrary: INSUFFICIENT_LIQUIDITY");
        uint256 numerator = reserveIn.mul(amountOut);
        uint256 denominator = reserveOut.sub(amountOut);
        amountIn = (numerator / denominator).add(1);
        amountIn = (amountIn.mul(PRECISION) + (PRECISION - fee - 1)) / (PRECISION - fee);
    }

    // performs chained getAmountOut calculations on any number of pairs
    function getAmountsOut(
        address factory,
        uint256 amountIn,
        IERC20[] memory path
    ) internal view returns (uint256[] memory amounts) {
        require(path.length >= 2, "XYZSwapLibrary: INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i; i < path.length - 1; i++) {
            (uint256 reserveIn, uint256 reserveOut, uint256 fee) = getTradeInfo(
                factory,
                path[i],
                path[i + 1]
            );
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut, fee);
        }
    }

    // performs chained getAmountIn calculations on any number of pairs
    function getAmountsIn(
        address factory,
        uint256 amountOut,
        IERC20[] memory path
    ) internal view returns (uint256[] memory amounts) {
        require(path.length >= 2, "XYZSwapLibrary: INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;
        for (uint256 i = path.length - 1; i > 0; i--) {
            (uint256 reserveIn, uint256 reserveOut, uint256 fee) = getTradeInfo(
                factory,
                path[i - 1],
                path[i]
            );
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut, fee);
        }
    }
}
