pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/Context.sol';
import './interfaces/IQuasarFactory.sol';
import './interfaces/IQuasarPair.sol';
import './QuasarPair.sol';

contract QuasarFactory is IQuasarFactory, Context {
  address public feeTo;
  address public feeToSetter;

  mapping(address => mapping(address => address)) public getPair;
  address[] public allPairs;

  constructor() {
    feeToSetter = _msgSender();
  }

  function allPairsLength() external view returns (uint256) {
    return allPairs.length;
  }

  function createPair(address tokenA, address tokenB) external returns (address pair) {
    require(tokenA != tokenB, 'Quasar: IDENTICAL_ADDRESSES');
    (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    require(token0 != address(0), 'Quasar: ZERO_ADDRESS');
    require(getPair[token0][token1] == address(0), 'Quasar: PAIR_EXISTS'); // single check is sufficient
    bytes memory bytecode = type(QuasarPair).creationCode;
    bytes32 salt = keccak256(abi.encodePacked(token0, token1));
    assembly {
      pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
    }
    IQuasarPair(pair).initialize(token0, token1);
    getPair[token0][token1] = pair;
    getPair[token1][token0] = pair; // populate mapping in the reverse direction
    allPairs.push(pair);
    emit PairCreated(token0, token1, pair, allPairs.length);
  }

  function setFeeTo(address _feeTo) external {
    require(_msgSender() == feeToSetter, 'Quasar: FORBIDDEN');
    feeTo = _feeTo;
  }

  function setFeeToSetter(address _feeToSetter) external {
    require(_msgSender() == feeToSetter, 'Quasar: FORBIDDEN');
    feeToSetter = _feeToSetter;
  }
}
