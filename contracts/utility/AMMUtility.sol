pragma solidity 0.6.6;

import '../libraries/SafeMath.sol';
import '../interfaces/IUnifarmRouter02.sol';
import '../interfaces/IERC20.sol';
import '../libraries/TransferHelper.sol';

contract AMMUtility {
    using SafeMath for uint256;

    address payable public feeTo;
    uint256 public fee;
    event TokenSwapExecuted(address sourceToken, address destinationToken, uint256 amount);

    constructor(address payable _feeTo, uint256 _fee) public {
        require(_feeTo != address(0), 'AMMUtility::constructor: ZERO_ADDRESS');

        fee = _fee;
        feeTo = _feeTo;
    }

    function swapTokens(
        address _userAddress,
        address _sourceToken,
        address _destToken,
        uint256 _amount
    ) external payable {
        require(_userAddress != address(0), 'AMMUtility::swapTokens: ZERO_USER_ADDRESS');
        require(_sourceToken != address(0) && _destToken != address(0), 'AMMUtility::swapTokens: ZERO_TOKEN_ADDRESS');
        require(_sourceToken != _destToken, 'AMMUtility::swapTokens: SAME_ADDRESS');
        require(_amount != 0, 'AMMUtility::swapTokens: ZERO_AMOUNT');
        require(msg.value >= fee, 'AMMUtility::swapTokens: INVALID_FEE_PROVIDED');

        TransferHelper.safeTransferETH(feeTo, fee);

        //swap tokens
        TransferHelper.safeTransferFrom(_sourceToken, _userAddress, address(this), _amount);
        uint256 tokensReceived = _swap(_sourceToken, _destToken, _amount);

        //transfer back the tokens swapped
        TransferHelper.safeTransfer(_destToken, _userAddress, tokensReceived);
        emit TokenSwapExecuted(_sourceToken, _destToken, tokensReceived);
    }

    function _swap(
        address _sourceToken,
        address _destinationToken,
        uint256 _amount
    ) internal pure returns (uint256 tokensReceived) {
        //to add supported AMM, 1 added for tests
        return 1;
    }
}
