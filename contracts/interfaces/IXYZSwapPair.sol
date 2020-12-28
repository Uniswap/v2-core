pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IXYZSwapPair {
    function mint(address to) external returns (uint256 liquidity);

    function burn(address to) external returns (uint256 amount0, uint256 amount1);

    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to,
        bytes calldata data
    ) external;

    function initialize(IERC20, IERC20) external;

    function getReserves()
        external
        view
        returns (
            uint112 reserve0,
            uint112 reserve1,
            uint32 blockTimestampLast
        );

    function getTradeInfo()
        external
        view
        returns (
            uint112 reserve0,
            uint112 reserve1,
            uint256 feeInPrecision
        );
}
