pragma solidity 0.6.6;

import '../libraries/SafeMath.sol';
import '../interfaces/IUnifarmRouter02.sol';
import '../interfaces/IERC20.sol';

contract AMMUtility {
    using SafeMath for uint256;

    address payable public feeTo;
    uint256 public fee;
    event TokenSwapExecuted(address sourceToken, address destinationToken, uint256 amount);

    constructor(address payable _feeTo, uint256 _fee) public {
        fee = _fee;
        feeTo = _feeTo;
    }

    function swapTokens(
        address _userAddress,
        address _sourceToken,
        address _destToken,
        uint256 _amount
    ) external payable {
        require(_sourceToken != address(0) && _destToken != address(0), 'Invalid token addresses');
        require(_amount != 0, 'Invalid token amount');
        require(msg.value >= fee, 'Fee not received');

        feeTo.transfer(fee);

        //swap tokens
        IERC20(_destToken).transferFrom(_userAddress, address(this), _amount);
        uint256 tokensReceived = _swap(_sourceToken, _destToken, _amount);

        //transfer back the tokens swapped
        IERC20(_destToken).transfer(_userAddress, tokensReceived);
        emit TokenSwapExecuted(_sourceToken, _destToken, tokensReceived);
    }

    function _swap(
        address _sourceToken,
        address _destinationToken,
        uint256 _amount
    ) internal returns (uint256 tokensReceived) {
        //to add supported AMM
    }
}
