pragma solidity >=0.5.0;

interface IUnifarmFactory {
    event PairCreated(address indexed token0, address indexed token1, address pair, uint256);

    function feeTo() external view returns (address payable);
    function pairConfigs(address)
        external
        view
        returns (
            bool lpFeesInToken,
            bool swapFeesInToken,
            uint256 lpFee,
            uint256 swapFee
        );

    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function allPairs(uint256) external view returns (address pair);
    function allPairsLength() external view returns (uint256);
    function createPair(address tokenA, address tokenB) external returns (address pair);

    function setFeeTo(address payable) external;
}
