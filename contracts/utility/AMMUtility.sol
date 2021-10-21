pragma solidity =0.5.16;

import '../libraries/SafeMath.sol';
import '../libraries/TransferHelper.sol';

import '../interfaces/IUnifarmRouter02.sol';
import '../interfaces/IERC20.sol';
import '../interfaces/IWETH.sol';

import '../Ownable.sol';
import './ReentrancyGuard.sol';

contract AMMUtility is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    IWETH public WETH;
    address public constant ETHAddress = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    address payable public feeTo;

    uint256 public fee;
    address fallbackReceiver;

    event TokenSwapExecuted(address sourceToken, address destinationToken, uint256 amount);

    constructor(
        address payable _feeTo,
        uint256 _fee,
        IWETH _weth
    ) public {
        require(_feeTo != address(0), 'ZERO_ADDRESS');
        require(address(_weth) != address(0), 'ZERO_ADDRESS_WETH');

        fee = _fee;
        feeTo = _feeTo;
        WETH = _weth;
    }

    function swapTokens(
        address _sourceToken,
        address _destToken,
        address _spender,
        address payable _swapTarget,
        bytes calldata _swapCallData,
        uint256 _sellAmount,
        uint256 _value
    ) external payable nonReentrant {
        require(_sourceToken != address(0) && _destToken != address(0), 'ZERO_TOKEN_ADDRESS');
        require(_sourceToken != _destToken, 'SAME_ADDRESS');
        require(msg.value == fee.add(_value), 'INVALID_FEE_PROVIDED');

        TransferHelper.safeTransferETH(feeTo, fee);

        //swap tokens
        if (_sourceToken != ETHAddress || _spender != address(0)) {
            TransferHelper.safeTransferFrom(_sourceToken, msg.sender, address(this), _sellAmount);
            TransferHelper.safeApprove(_sourceToken, _spender, 0);
            TransferHelper.safeApprove(_sourceToken, _spender, _sellAmount);
        }

        uint256 tokensReceived = _swap(IERC20(_destToken), _swapTarget, _swapCallData, _value);

        //transfer back the tokens swapped
        TransferHelper.safeTransfer(_destToken, msg.sender, tokensReceived);
        emit TokenSwapExecuted(_sourceToken, _destToken, tokensReceived);
    }

    function _swap(
        IERC20 _destToken,
        address payable _swapTarget,
        bytes memory _swapCallData,
        uint256 _value
    ) internal returns (uint256 boughtAmount) {
        fallbackReceiver = _swapTarget;
        boughtAmount = _destToken.balanceOf(address(this));

        // Call the encoded swap function call on the contract at `swapTarget`,
        // passing along any ETH attached to this function call to cover protocol fees.
        (bool success, ) = _swapTarget.call.value(_value)(_swapCallData);
        require(success, 'SWAP_CALL_FAILED');

        // Refund any unspent protocol fees to the sender.
        msg.sender.transfer(address(this).balance);

        boughtAmount = _destToken.balanceOf(address(this)) - boughtAmount;
    }

    function() external payable {
        require(msg.sender == fallbackReceiver, 'ERR_INVALID_ETH_SENDER');
    }

    function withdrawToken(IERC20 token, uint256 amount) external onlyOwner {
        require(token.transfer(msg.sender, amount));
    }

    function withdrawETH() external onlyOwner {
        uint256 contractBalance = address(this).balance;
        msg.sender.transfer(contractBalance);
    }
}
