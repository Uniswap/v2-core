pragma solidity =0.5.16;

import './interfaces/IUniswapV2Pair.sol';
import './interfaces/IUniswapV2Factory.sol';
import './interfaces/IApprovedTokenManager.sol';
import './UniswapV2Pair.sol';

contract UniswapV2Factory is IUniswapV2Factory {
    address public feeTo;
    address public feeToSetter;
    IApprovedTokenManager public approvedTokenManager = IApprovedTokenManager(0);

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    // for claimLightReward
    address public stHope = address(0);
    address public minter = address(0);
    address public ltToken = address(0) ;
    mapping(address => address) pairGomboc;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint);
    event SetLightRewardParams(address _stHope, address _minter, address _ltToken);
    event SetPairGomboc(address pair, address gomboc);

    constructor(address _feeToSetter) public {
        feeToSetter = _feeToSetter;
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, 'HopeSwap: IDENTICAL_ADDRESSES');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'HopeSwap: ZERO_ADDRESS');
        require(getPair[token0][token1] == address(0), 'HopeSwap: PAIR_EXISTS'); // single check is sufficient
        if (approvedTokenManager != IApprovedTokenManager(0)) {
            require(approvedTokenManager.isApprovedToken(token0)
                    && approvedTokenManager.isApprovedToken(token1),
                    'HopeSwap: FORBIDDEN');
        }
        bytes memory bytecode = type(UniswapV2Pair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IUniswapV2Pair(pair).initialize(token0, token1);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, 'HopeSwap: FORBIDDEN');
        feeTo = _feeTo;
        emit SetFeeTo(_feeTo);
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, 'HopeSwap: FORBIDDEN');
        feeToSetter = _feeToSetter;
        emit SetFeeToSetter(_feeToSetter);
    }

    function setApprovedTokenManager(IApprovedTokenManager _approvedTokenManager) external {
        require(msg.sender == feeToSetter, 'HopeSwap: FORBIDDEN');
        approvedTokenManager = _approvedTokenManager;
        emit SetApprovedTokenManager(_approvedTokenManager);
    }

    function setFeeRateNumerator(address tokenA, address tokenB, uint32 feeRateNumerator) external {
        require(msg.sender == feeToSetter, 'HopeSwap: FORBIDDEN');
        IUniswapV2Pair(getPair[tokenA][tokenB]).setFeeRateNumerator(feeRateNumerator);
        emit SetFeeRateNumerator(tokenA, tokenB, feeRateNumerator);
    }

    function setLightRewardParams(address _stHope, address _minter, address _ltToken) external {
        require(msg.sender == feeToSetter, 'HopeSwap: FORBIDDEN');
        require(_stHope!=address(0), "HopeSwap: ZERO_ADDRESS");
        require(_minter!=address(0), "HopeSwap: ZERO_ADDRESS");
        require(_ltToken!=address(0), "HopeSwap: ZERO_ADDRESS");

        stHope = _stHope;
        minter = _minter;
        ltToken = _ltToken;
        emit SetLightRewardParams(_stHope, _minter, _ltToken);
    }

    function setPairGomboc(address pair, address gomboc) external {
        require(msg.sender == feeToSetter, 'HopeSwap: FORBIDDEN');

        require(pair!=address(0), "HopeSwap: ZERO_ADDRESS");
        require(gomboc!=address(0), "HopeSwap: ZERO_ADDRESS");

        pairGomboc[pair] = gomboc;
        emit SetPairGomboc(pair, gomboc);
    }

    function getLightRewardParams(address pair) external view returns (address _stHope, address _minter, address _ltToken, address _pairGomboc) {
        _pairGomboc = pairGomboc[pair];
        _stHope = stHope;
        _minter = minter;
        _ltToken = ltToken;
    }
}
