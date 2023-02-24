pragma solidity >=0.5.0;
import './IApprovedTokenManager.sol';

interface IUniswapV2Factory {
    event PairCreated(address indexed token0, address indexed token1, address pair, uint);
    event SetFeeTo(address);
    event SetFeeToSetter(address);
    event SetFeeRateNumerator(address, address, uint32);
    event SetApprovedTokenManager(IApprovedTokenManager);

    function feeTo() external view returns (address);
    function feeToSetter() external view returns (address);

    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function allPairs(uint) external view returns (address pair);
    function allPairsLength() external view returns (uint);

    function createPair(address tokenA, address tokenB) external returns (address pair);

    function setFeeTo(address) external;
    function setFeeToSetter(address) external;
    function setApprovedTokenManager(IApprovedTokenManager _approvedTokenManager) external;
    function setFeeRateNumerator(address tokenA, address tokenB, uint32 feeRateNumerator) external;
}
