pragma solidity =0.5.16;

import './interfaces/IUniswapV2Factory.sol';
import './UniswapV2Pair.sol';

contract UniswapV2Factory is IUniswapV2Factory {
    address public feeTo; // Address to which the trading fee is sent
    address public feeToSetter; // Address that is allowed to update the feeTo address

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs; // Array to store all created pair addresses

    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    constructor(address _feeToSetter) public {
        feeToSetter = _feeToSetter; // Set the initial feeToSetter address during contract deployment
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length; // Returns the number of created pairs
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, 'UniswapV2: IDENTICAL_ADDRESSES'); 
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA); // Sort tokens lexicographically
        require(token0 != address(0), 'UniswapV2: ZERO_ADDRESS');
        require(getPair[token0][token1] == address(0), 'UniswapV2: PAIR_EXISTS'); 
        bytes memory bytecode = type(UniswapV2Pair).creationCode; // Get the bytecode of the UniswapV2Pair contract
        bytes32 salt = keccak256(abi.encodePacked(token0, token1)); // Generate a unique salt using the tokens' addresses
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt) // Deploy the pair contract using create2 with the provided bytecode and salt
        }
        IUniswapV2Pair(pair).initialize(token0, token1); // Initialize the newly created pair with the token addresses
        getPair[token0][token1] = pair; 
        getPair[token1][token0] = pair;
        allPairs.push(pair); // Add the new pair address to the array of all pairs
        emit PairCreated(token0, token1, pair, allPairs.length); 
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, 'UniswapV2: FORBIDDEN'); // Only the feeToSetter can update the feeTo address
        feeTo = _feeTo; // Update the feeTo address
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, 'UniswapV2: FORBIDDEN'); // Only the current feeToSetter can update the feeToSetter address
        feeToSetter = _feeToSetter; // Update the feeToSetter address
    }
}
