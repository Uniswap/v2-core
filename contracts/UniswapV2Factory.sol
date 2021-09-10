pragma solidity =0.5.16;

import './interfaces/IUniswapV2Factory.sol';
import './UniswapV2Pair.sol';
import './Ownable.sol';

contract UniswapV2Factory is IUniswapV2Factory, Ownable {
    address payable public feeTo;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    struct Pair {
        bool lpFeesInToken;
        bool swapFeesInToken;
        uint256 lpFee;
        uint256 swapFee;
    }
    mapping(address => Pair) public pairConfigs;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256);

    constructor(
        address payable _feeTo,
        uint256 _lpFee,
        uint256 _swapFee,
        bool _lpFeesInToken,
        bool _swapFeesInToken
    ) public {
        require(_feeTo != address(0), 'UniswapV2: WALLET_ZERO_ADDRESS');
        feeTo = _feeTo;

        Pair memory pair;
        pair.lpFeesInToken = _lpFeesInToken;
        pair.swapFeesInToken = _swapFeesInToken;
        pair.lpFee = _lpFee;
        pair.swapFee = _swapFee;

        pairConfigs[address(0)] = pair;
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, 'UniswapV2: IDENTICAL_ADDRESSES');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'UniswapV2: ZERO_ADDRESS');
        require(getPair[token0][token1] == address(0), 'UniswapV2: PAIR_EXISTS'); // single check is sufficient
        bytes memory bytecode = type(UniswapV2Pair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IUniswapV2Pair(pair).initialize(token0, token1);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction

        Pair memory globalConfig = pairConfigs[address(0)];
        pairConfigs[pair] = globalConfig;

        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address payable _feeTo) external onlyOwner {
        feeTo = _feeTo;
    }

    function updateLPFeeConfig(
        address _pairAddress,
        bool _feeInToken,
        uint256 _fee
    ) external onlyOwner {
        //To set max and min limit for both fee types
        Pair storage pair = pairConfigs[_pairAddress];
        pair.lpFeesInToken = _feeInToken;
        pair.lpFee = _fee;
    }

    function updateSwapFeeConfig(
        address _pairAddress,
        bool _feeInToken,
        uint256 _fee
    ) external onlyOwner {
        //To set max and min limit for both fee types
        Pair storage pair = pairConfigs[_pairAddress];
        pair.lpFeesInToken = _feeInToken;
        pair.lpFee = _fee;
    }
}
