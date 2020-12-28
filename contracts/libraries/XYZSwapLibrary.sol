pragma solidity 0.6.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IXYZSwapPair.sol";

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
                        hex"bcd83b5cb3a7787d385e9b6ce85f55121f9c7e3e45ff594acdcf51fc8329596e" // init code hash
                    )
                )
            )
        );
    }

    /// @dev fetch the reserves and fee for a pair, used for trading purpose
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
            uint256 feeInPrecision
        )
    {
        (IERC20 token0, ) = sortTokens(tokenA, tokenB);
        (reserveA, reserveB, feeInPrecision) = IXYZSwapPair(pairFor(factory, tokenA, tokenB))
            .getTradeInfo();
        (reserveA, reserveB) = tokenA == token0 ? (reserveA, reserveB) : (reserveB, reserveA);
    }

    /// @dev fetches the reserves for a pair, used for liquidity adding
    function getReserves(
        address factory,
        IERC20 tokenA,
        IERC20 tokenB
    ) internal view returns (uint256 reserveA, uint256 reserveB) {
        (IERC20 token0, ) = sortTokens(tokenA, tokenB);
        (uint256 reserve0, uint256 reserve1, ) = IXYZSwapPair(pairFor(factory, tokenA, tokenB))
            .getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
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
        uint256 feeInPrecision
    ) internal pure returns (uint256 amountOut) {
        require(amountIn > 0, "XYZSwapLibrary: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "XYZSwapLibrary: INSUFFICIENT_LIQUIDITY");
        require(feeInPrecision < PRECISION, "XYZSwapLibrary: INVALID_FEE");
        uint256 amountInWithFee = amountIn.mul(PRECISION - feeInPrecision).div(PRECISION);
        uint256 numerator = amountInWithFee.mul(reserveOut);
        uint256 denominator = reserveIn.add(amountInWithFee);
        amountOut = numerator.div(denominator);
    }

    // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 feeInPrecision
    ) internal pure returns (uint256 amountIn) {
        require(amountOut > 0, "XYZSwapLibrary: INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "XYZSwapLibrary: INSUFFICIENT_LIQUIDITY");
        require(feeInPrecision < PRECISION, "XYZSwapLibrary: INVALID_FEE");
        uint256 numerator = reserveIn.mul(amountOut);
        uint256 denominator = reserveOut.sub(amountOut);
        amountIn = numerator.div(denominator).add(1);
        // amountIn = floor(amountIN *PRECISION / (PRECISION - feeInPrecision));
        numerator = amountIn.mul(PRECISION);
        denominator = PRECISION - feeInPrecision;
        amountIn = numerator.add(denominator - 1).div(denominator);
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
            (uint256 reserveIn, uint256 reserveOut, uint256 feeInPrecision) = getTradeInfo(
                factory,
                path[i],
                path[i + 1]
            );
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut, feeInPrecision);
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
            (uint256 reserveIn, uint256 reserveOut, uint256 feeInPrecision) = getTradeInfo(
                factory,
                path[i - 1],
                path[i]
            );
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut, feeInPrecision);
        }
    }
}
