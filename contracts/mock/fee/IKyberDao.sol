// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

interface IEpochUtils {
    function epochPeriodInSeconds() external view returns (uint256);

    function firstEpochStartTimestamp() external view returns (uint256);

    function getCurrentEpochNumber() external view returns (uint256);

    function getEpochNumber(uint256 timestamp) external view returns (uint256);
}

interface IKyberDao is IEpochUtils {
    event Voted(
        address indexed staker,
        uint256 indexed epoch,
        uint256 indexed campaignID,
        uint256 option
    );

    function getLatestNetworkFeeDataWithCache()
        external
        returns (uint256 feeInBps, uint256 expiryTimestamp);

    function getLatestBRRDataWithCache()
        external
        returns (
            uint256 burnInBps,
            uint256 rewardInBps,
            uint256 rebateInBps,
            uint256 epoch,
            uint256 expiryTimestamp
        );

    function handleWithdrawal(address staker, uint256 penaltyAmount) external;

    function vote(uint256 campaignID, uint256 option) external;

    function getLatestNetworkFeeData()
        external
        view
        returns (uint256 feeInBps, uint256 expiryTimestamp);

    function shouldBurnRewardForEpoch(uint256 epoch) external view returns (bool);

    /**
     * @dev  return staker's reward percentage in precision for a past epoch only
     *       fee handler should call this function when a staker wants to claim reward
     *       return 0 if staker has no votes or stakes
     */
    function getPastEpochRewardPercentageInPrecision(address staker, uint256 epoch)
        external
        view
        returns (uint256);

    /**
     * @dev  return staker's reward percentage in precision for the current epoch
     *       reward percentage is not finalized until the current epoch is ended
     */
    function getCurrentEpochRewardPercentageInPrecision(address staker)
        external
        view
        returns (uint256);
}
