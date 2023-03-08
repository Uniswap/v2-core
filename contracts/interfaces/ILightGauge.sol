pragma solidity >=0.5.0;

interface ILightGauge{
    function claimableTokens(address to) external returns (uint256);
    function depositRewardToken(address token, uint256 amount) external;
}
interface IMinter{
    function mint(address) external;
}
