pragma solidity 0.6.6;

import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/IXYZSwapFactory.sol";

contract DaoRegistry is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    address public immutable factory;
    mapping(IERC20 => mapping(IERC20 => EnumerableSet.AddressSet)) internal tokenPairs;

    event AddPair(IERC20 token0, IERC20 token1, address pair, bool isAdd);

    constructor(address _factory) public Ownable() {
        factory = _factory;
    }

    function addPair(
        IERC20 token0,
        IERC20 token1,
        address pair,
        bool isAdd
    ) external onlyOwner {
        // populate mapping in the reverse direction
        if (isAdd) {
            require(
                IXYZSwapFactory(factory).isPair(token0, token1, pair),
                "Registry: INVALID_PAIR"
            );

            tokenPairs[token0][token1].add(pair);
            tokenPairs[token1][token0].add(pair);
        } else {
            tokenPairs[token0][token1].remove(pair);
            tokenPairs[token1][token0].remove(pair);
        }

        emit AddPair(token0, token1, pair, isAdd);
    }

    function getPairs(IERC20 token0, IERC20 token1)
        external
        view
        returns (address[] memory _tokenPairs)
    {
        uint256 length = tokenPairs[token0][token1].length();
        _tokenPairs = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            _tokenPairs[i] = tokenPairs[token0][token1].at(i);
        }
    }
}
