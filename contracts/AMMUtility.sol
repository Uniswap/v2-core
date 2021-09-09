pragma solidity 0.6.6;

import './libraries/SafeMath.sol';
import './interfaces/IUniswapV2Router02.sol';

contract AMMUtility {
    using SafeMath for uint256;

    address public uniswapRouter;
    address payable public feeTo;
    uint256 public fee;
    event TokenSwapExecuted(address sourceToken, address destinationToken, uint256 amount);
    event AddedLiquidity(address userAddress, uint256 lpTokens);

    constructor(
        address _uniswapRouter,
        address payable _feeTo,
        uint256 _fee
    ) public {
        uniswapRouter = _uniswapRouter;
        fee = _fee;
        feeTo = _feeTo;
    }

    function swapAndAddLiquidity(
        address _userAddress,
        address _sourceToken,
        address _destToken,
        uint256 _amount
    ) external payable {
        require(_sourceToken != address(0) && _destToken != address(0), 'Invalid token addresses');
        require(_amount != 0, 'Invalid token amount');
        require(msg.value >= fee, 'Fee not received');

        feeTo.transfer(fee);

        //swap half tokens
        uint256 toSwap = _amount / 2;
        uint256 tokensReceived = _swap(_sourceToken, _destToken, toSwap);

        //add liquidity
        (, , uint256 liquidity) = IUniswapV2Router02(uniswapRouter).addLiquidity(
            _sourceToken,
            _destToken,
            _amount.sub(toSwap),
            tokensReceived,
            1,
            1,
            msg.sender,
            0xff
        );
        emit AddedLiquidity(msg.sender, liquidity);
    }

    function _swap(
        address _sourceToken,
        address _destinationToken,
        uint256 _amount
    ) internal returns (uint256 tokensReceived) {
        //to add supported AMM
        emit TokenSwapExecuted(_sourceToken, _destinationToken, _amount);
    }
}
