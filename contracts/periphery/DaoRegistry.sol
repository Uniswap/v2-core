// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/IDMMFactory.sol";

contract DaoRegistry is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    address public immutable factory;
    mapping(IERC20 => mapping(IERC20 => EnumerableSet.AddressSet)) internal tokenPools;

    event AddPool(IERC20 token0, IERC20 token1, address pool, bool isAdd);

    constructor(address _factory) public Ownable() {
        factory = _factory;
    }

    function addPool(
        IERC20 token0,
        IERC20 token1,
        address pool,
        bool isAdd
    ) external onlyOwner {
        // populate mapping in the reverse direction
        if (isAdd) {
            require(IDMMFactory(factory).isPool(token0, token1, pool), "Registry: INVALID_POOL");

            tokenPools[token0][token1].add(pool);
            tokenPools[token1][token0].add(pool);
        } else {
            tokenPools[token0][token1].remove(pool);
            tokenPools[token1][token0].remove(pool);
        }

        emit AddPool(token0, token1, pool, isAdd);
    }

    function getPools(IERC20 token0, IERC20 token1)
        external
        view
        returns (address[] memory _tokenPools)
    {
        uint256 length = tokenPools[token0][token1].length();
        _tokenPools = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            _tokenPools[i] = tokenPools[token0][token1].at(i);
        }
    }
}
