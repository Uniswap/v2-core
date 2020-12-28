pragma solidity 0.6.6;

import "./interfaces/IXYZSwapFactory.sol";

import "./XYZSwapPair.sol";

contract XYZSwapFactory is IXYZSwapFactory {
    address public override feeTo;
    address public override feeToSetter;

    mapping(IERC20 => mapping(IERC20 => address)) public override getPair;
    address[] public override allPairs;

    event PairCreated(
        address indexed token0,
        address indexed token1,
        address pair,
        uint256 totalPair
    );

    constructor(address _feeToSetter) public {
        feeToSetter = _feeToSetter;
    }

    function createPair(IERC20 tokenA, IERC20 tokenB) external override returns (address pair) {
        require(tokenA != tokenB, "XYZSwap: IDENTICAL_ADDRESSES");
        (IERC20 token0, IERC20 token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(address(token0) != address(0), "XYZSwap: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "XYZSwap: PAIR_EXISTS"); // single check is sufficient
        bytes memory bytecode = type(XYZSwapPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IXYZSwapPair(pair).initialize(token0, token1);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        emit PairCreated(address(token0), address(token1), pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external override {
        require(msg.sender == feeToSetter, "XYZSwap: FORBIDDEN");
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external override {
        require(msg.sender == feeToSetter, "XYZSwap: FORBIDDEN");
        feeToSetter = _feeToSetter;
    }

    function allPairsLength() external override view returns (uint256) {
        return allPairs.length;
    }
}
