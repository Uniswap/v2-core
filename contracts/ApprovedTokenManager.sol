pragma solidity >=0.5.0;
import './interfaces/IApprovedTokenManager.sol';
import './Ownable.sol';

contract ApprovedTokenManager is IApprovedTokenManager,  Ownable{
    mapping(address=>bool) public approvedToken;
    event ApproveToken(address token, bool approved);

    function isApprovedToken(address token) public view returns (bool){
      return approvedToken[token];
    }

    function approveToken(address token, bool approved)  public onlyOwner{
      emit ApproveToken(token, approved);
      approvedToken[token]= approved;
    }
}
