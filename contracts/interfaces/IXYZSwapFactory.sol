pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IXYZSwapFactory {
    function createPair(
        IERC20 tokenA,
        IERC20 tokenB,
        uint32 ampBps
    ) external returns (address pair);

    function setFeeTo(address) external;

    function setFeeToSetter(address) external;

    function feeTo() external view returns (address);

    function feeToSetter() external view returns (address);

    function allPairs(uint256) external view returns (address pair);

    function allPairsLength() external view returns (uint256);

    function getNonAmpPair(IERC20 token0, IERC20 token1) external view returns (address);

    function getPairs(IERC20 token0, IERC20 token1)
        external
        view
        returns (address[] memory _tokenPairs);

    function isPair(
        IERC20 token0,
        IERC20 token1,
        address pair
    ) external view returns (bool);
}
