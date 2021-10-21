pragma solidity =0.5.16;

import './interfaces/IUnifarmFactory.sol';
import './UnifarmPair.sol';
import './Ownable.sol';
import './BaseRelayRecipient.sol';

contract UnifarmFactory is IUnifarmFactory, Ownable, BaseRelayRecipient {
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

    event PairCreated(
        address indexed token0,
        address indexed token1,
        address pair,
        bool lpFeesInToken,
        bool swapFeesInToken,
        uint256 lpFee,
        uint256 swapFee
    );
    event UpdatedLPFee(address indexed pair, bool feeInToken, uint256 fee);
    event UpdatedSwapFee(address indexed pair, bool feeInToken, uint256 fee);

    constructor(
        address payable _feeTo,
        address _trustedForwarder,
        uint256 _lpFee,
        uint256 _swapFee,
        bool _lpFeesInToken,
        bool _swapFeesInToken
    ) public {
        require(_feeTo != address(0), 'Unifarm: WALLET_ZERO_ADDRESS');
        require(_trustedForwarder != address(0), 'Unifarm: TRUSTED_FORWARDER_ZERO_ADDRESS');

        feeTo = _feeTo;

        Pair memory pair;
        pair.lpFeesInToken = _lpFeesInToken;
        pair.swapFeesInToken = _swapFeesInToken;
        pair.lpFee = _lpFee;
        pair.swapFee = _swapFee;

        trustedForwarder = _trustedForwarder;

        pairConfigs[address(0)] = pair;
    }

    /*
     * Override this function.
     * This version is to keep track of BaseRelayRecipient you are using
     * in your contract.
     */
    function versionRecipient() external view returns (string memory) {
        return '1';
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, 'Unifarm: IDENTICAL_ADDRESSES');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'Unifarm: ZERO_ADDRESS');
        require(getPair[token0][token1] == address(0), 'Unifarm: PAIR_EXISTS'); // single check is sufficient
        bytes memory bytecode = type(UnifarmPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IUnifarmPair(pair).initialize(token0, token1, trustedForwarder);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction

        Pair memory globalConfig = pairConfigs[address(0)];
        pairConfigs[pair] = globalConfig;

        allPairs.push(pair);
        emit PairCreated(
            token0,
            token1,
            pair,
            globalConfig.lpFeesInToken,
            globalConfig.swapFeesInToken,
            globalConfig.lpFee,
            globalConfig.swapFee
        );
    }

    function setFeeTo(address payable _feeTo) external onlyOwner {
        require(_feeTo != address(0), 'Unifarm: WALLET_ZERO_ADDRESS');
        feeTo = _feeTo;
    }

    function updateLPFeeConfig(
        address tokenA,
        address tokenB,
        bool _feeInToken,
        uint256 _fee
    ) external onlyOwner {
        address _pairAddress = getPair[tokenA][tokenB];
        require(_pairAddress != address(0), 'Unifarm: ZERO_ADDRESS_FOR_PAIR');
        if (_feeInToken) {
            require(_fee >= 0 && _fee <= 1000, 'Unifarm: INVALID_FEE');
        }

        Pair storage pair = pairConfigs[_pairAddress];
        pair.lpFeesInToken = _feeInToken;
        pair.lpFee = _fee;

        emit UpdatedLPFee(_pairAddress, _feeInToken, _fee);
    }

    function updateSwapFeeConfig(
        address tokenA,
        address tokenB,
        bool _feeInToken,
        uint256 _fee
    ) external onlyOwner {
        address _pairAddress = getPair[tokenA][tokenB];
        require(_pairAddress != address(0), 'Unifarm: ZERO_ADDRESS_FOR_PAIR');
        if (_feeInToken) {
            require(_fee >= 0 && _fee <= 1000, 'Unifarm: INVALID_FEE');
        }

        Pair storage pair = pairConfigs[_pairAddress];
        pair.lpFeesInToken = _feeInToken;
        pair.lpFee = _fee;

        emit UpdatedSwapFee(_pairAddress, _feeInToken, _fee);
    }
}
