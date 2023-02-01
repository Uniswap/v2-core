pragma solidity >=0.5.0;

interface IApprovedTokenManager {
    function isApprovedToken(address) external view returns (bool);
}
