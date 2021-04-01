pragma solidity 0.6.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IDMMPool.sol";

library DMMLibrary {
    using SafeMath for uint256;

    uint256 public constant PRECISION = 1e18;

    // returns sorted token addresses, used to handle return values from pools sorted in this order
    function sortTokens(IERC20 tokenA, IERC20 tokenB)
        internal
        pure
        returns (IERC20 token0, IERC20 token1)
    {
        require(tokenA != tokenB, "DMMLibrary: IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(address(token0) != address(0), "DMMLibrary: ZERO_ADDRESS");
    }

    /// @dev fetch the reserves and fee for a pool, used for trading purposes
    function getTradeInfo(
        address pool,
        IERC20 tokenA,
        IERC20 tokenB
    )
        internal
        view
        returns (
            uint256 reserveA,
            uint256 reserveB,
            uint256 vReserveA,
            uint256 vReserveB,
            uint256 feeInPrecision
        )
    {
        (IERC20 token0, ) = sortTokens(tokenA, tokenB);
        uint256 reserve0;
        uint256 reserve1;
        uint256 vReserve0;
        uint256 vReserve1;
        (reserve0, reserve1, vReserve0, vReserve1, feeInPrecision) = IDMMPool(pool).getTradeInfo();
        (reserveA, reserveB, vReserveA, vReserveB) = tokenA == token0
            ? (reserve0, reserve1, vReserve0, vReserve1)
            : (reserve1, reserve0, vReserve1, vReserve0);
    }

    /// @dev fetches the reserves for a pool, used for liquidity adding
    function getReserves(
        address pool,
        IERC20 tokenA,
        IERC20 tokenB
    ) internal view returns (uint256 reserveA, uint256 reserveB) {
        (IERC20 token0, ) = sortTokens(tokenA, tokenB);
        (uint256 reserve0, uint256 reserve1) = IDMMPool(pool).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    // given some amount of an asset and pool reserves, returns an equivalent amount of the other asset
    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) internal pure returns (uint256 amountB) {
        require(amountA > 0, "DMMLibrary: INSUFFICIENT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "DMMLibrary: INSUFFICIENT_LIQUIDITY");
        amountB = amountA.mul(reserveB) / reserveA;
    }

    // given an input amount of an asset and pool reserves, returns the maximum output amount of the other asset
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 vReserveIn,
        uint256 vReserveOut,
        uint256 feeInPrecision
    ) internal pure returns (uint256 amountOut) {
        require(amountIn > 0, "DMMLibrary: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "DMMLibrary: INSUFFICIENT_LIQUIDITY");
        uint256 amountInWithFee = amountIn.mul(PRECISION.sub(feeInPrecision)).div(PRECISION);
        uint256 numerator = amountInWithFee.mul(vReserveOut);
        uint256 denominator = vReserveIn.add(amountInWithFee);
        amountOut = numerator.div(denominator);
        require(reserveOut > amountOut, "DMMLibrary: INSUFFICIENT_LIQUIDITY");
    }

    // given an output amount of an asset and pool reserves, returns a required input amount of the other asset
    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 vReserveIn,
        uint256 vReserveOut,
        uint256 feeInPrecision
    ) internal pure returns (uint256 amountIn) {
        require(amountOut > 0, "DMMLibrary: INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > amountOut, "DMMLibrary: INSUFFICIENT_LIQUIDITY");
        uint256 numerator = vReserveIn.mul(amountOut);
        uint256 denominator = vReserveOut.sub(amountOut);
        amountIn = numerator.div(denominator).add(1);
        // amountIn = floor(amountIN *PRECISION / (PRECISION - feeInPrecision));
        numerator = amountIn.mul(PRECISION);
        denominator = PRECISION.sub(feeInPrecision);
        amountIn = numerator.add(denominator - 1).div(denominator);
    }

    // performs chained getAmountOut calculations on any number of pools
    function getAmountsOut(
        uint256 amountIn,
        address[] memory poolsPath,
        IERC20[] memory path
    ) internal view returns (uint256[] memory amounts) {
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i; i < path.length - 1; i++) {
            (
                uint256 reserveIn,
                uint256 reserveOut,
                uint256 vReserveIn,
                uint256 vReserveOut,
                uint256 feeInPrecision
            ) = getTradeInfo(poolsPath[i], path[i], path[i + 1]);
            amounts[i + 1] = getAmountOut(
                amounts[i],
                reserveIn,
                reserveOut,
                vReserveIn,
                vReserveOut,
                feeInPrecision
            );
        }
    }

    // performs chained getAmountIn calculations on any number of pools
    function getAmountsIn(
        uint256 amountOut,
        address[] memory poolsPath,
        IERC20[] memory path
    ) internal view returns (uint256[] memory amounts) {
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;
        for (uint256 i = path.length - 1; i > 0; i--) {
            (
                uint256 reserveIn,
                uint256 reserveOut,
                uint256 vReserveIn,
                uint256 vReserveOut,
                uint256 feeInPrecision
            ) = getTradeInfo(poolsPath[i - 1], path[i - 1], path[i]);
            amounts[i - 1] = getAmountIn(
                amounts[i],
                reserveIn,
                reserveOut,
                vReserveIn,
                vReserveOut,
                feeInPrecision
            );
        }
    }
}
