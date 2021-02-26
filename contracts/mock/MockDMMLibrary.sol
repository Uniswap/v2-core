pragma solidity 0.6.6;

import "../libraries/DMMLibrary.sol";

contract MockDMMLibrary {
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 vReserveIn,
        uint256 vReserveOut,
        uint256 fee
    ) external pure returns (uint256 amountOut) {
        return
            DMMLibrary.getAmountOut(amountIn, reserveIn, reserveOut, vReserveIn, vReserveOut, fee);
    }

    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 vReserveIn,
        uint256 vReserveOut,
        uint256 fee
    ) external pure returns (uint256 amountIn) {
        return
            DMMLibrary.getAmountIn(amountOut, reserveIn, reserveOut, vReserveIn, vReserveOut, fee);
    }

    function sortTokens(IERC20 tokenA, IERC20 tokenB)
        external
        pure
        returns (IERC20 token0, IERC20 token1)
    {
        return DMMLibrary.sortTokens(tokenA, tokenB);
    }
}
