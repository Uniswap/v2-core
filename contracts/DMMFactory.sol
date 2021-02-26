pragma solidity 0.6.6;

import "@openzeppelin/contracts/utils/EnumerableSet.sol";

import "./interfaces/IDMMFactory.sol";
import "./DMMPool.sol";

contract DMMFactory is IDMMFactory {
    using EnumerableSet for EnumerableSet.AddressSet;

    uint256 internal constant BPS = 10000;

    address private feeTo;
    uint16 private governmentFeeBps;
    address public override feeToSetter;

    mapping(IERC20 => mapping(IERC20 => EnumerableSet.AddressSet)) internal tokenPools;
    mapping(IERC20 => mapping(IERC20 => address)) public override getUnamplifiedPool;
    address[] public override allPools;

    event PoolCreated(
        IERC20 indexed token0,
        IERC20 indexed token1,
        address pool,
        uint32 ampBps,
        uint256 totalPool
    );
    event SetFeeConfiguration(address feeTo, uint16 governmentFeeBps);
    event SetFeeToSetter(address feeToSetter);

    constructor(address _feeToSetter) public {
        feeToSetter = _feeToSetter;
    }

    function createPool(
        IERC20 tokenA,
        IERC20 tokenB,
        uint32 ampBps
    ) external override returns (address pool) {
        require(tokenA != tokenB, "DMM: IDENTICAL_ADDRESSES");
        (IERC20 token0, IERC20 token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(address(token0) != address(0), "DMM: ZERO_ADDRESS");
        require(ampBps >= BPS, "DMM: INVALID_BPS");
        // only exist 1 unamplified pool of a pool.
        require(
            ampBps != BPS || getUnamplifiedPool[token0][token1] == address(0),
            "DMM: UNAMPLIFIED_POOL_EXISTS"
        );
        pool = address(new DMMPool());
        DMMPool(pool).initialize(token0, token1, ampBps);
        // populate mapping in the reverse direction
        tokenPools[token0][token1].add(pool);
        tokenPools[token1][token0].add(pool);
        if (ampBps == BPS) {
            getUnamplifiedPool[token0][token1] = pool;
            getUnamplifiedPool[token1][token0] = pool;
        }
        allPools.push(pool);

        emit PoolCreated(token0, token1, pool, ampBps, allPools.length);
    }

    function setFeeConfiguration(address _feeTo, uint16 _governmentFeeBps) external override {
        require(msg.sender == feeToSetter, "DMM: FORBIDDEN");
        require(_governmentFeeBps > 0 && _governmentFeeBps < 2000, "DMM: INVALID FEE");
        feeTo = _feeTo;
        governmentFeeBps = _governmentFeeBps;

        emit SetFeeConfiguration(_feeTo, _governmentFeeBps);
    }

    function setFeeToSetter(address _feeToSetter) external override {
        require(msg.sender == feeToSetter, "DMM: FORBIDDEN");
        feeToSetter = _feeToSetter;

        emit SetFeeToSetter(_feeToSetter);
    }

    function getFeeConfiguration()
        external
        override
        view
        returns (address _feeTo, uint16 _governmentFeeBps)
    {
        _feeTo = feeTo;
        _governmentFeeBps = governmentFeeBps;
    }

    function allPoolsLength() external override view returns (uint256) {
        return allPools.length;
    }

    function getPools(IERC20 token0, IERC20 token1)
        external
        override
        view
        returns (address[] memory _tokenPools)
    {
        uint256 length = tokenPools[token0][token1].length();
        _tokenPools = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            _tokenPools[i] = tokenPools[token0][token1].at(i);
        }
    }

    function getPoolsLength(IERC20 token0, IERC20 token1) external view returns (uint256) {
        return tokenPools[token0][token1].length();
    }

    function getPoolAtIndex(
        IERC20 token0,
        IERC20 token1,
        uint256 index
    ) external view returns (address pool) {
        return tokenPools[token0][token1].at(index);
    }

    function isPool(
        IERC20 token0,
        IERC20 token1,
        address pool
    ) external override view returns (bool) {
        return tokenPools[token0][token1].contains(pool);
    }
}
