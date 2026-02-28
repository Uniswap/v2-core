// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import "./IKyberDao.sol";

contract MockKyberDao is IKyberDao {
    uint256 public constant BPS = 10000; // Basic Price Steps. 1 step = 0.01%

    uint256 public rewardInBPS;
    uint256 public rebateInBPS;
    uint256 public epoch;
    uint256 public expiryTimestamp;
    uint256 public feeBps;
    uint256 public epochPeriod = 160;
    uint256 public startTimestamp;
    uint256 public rewardPercentageInPrecision;
    uint256 data;
    mapping(uint256 => bool) public shouldBurnRewardEpoch;

    constructor(
        uint256 _rewardInBPS,
        uint256 _rebateInBPS,
        uint256 _epoch,
        uint256 _expiryTimestamp
    ) public {
        rewardInBPS = _rewardInBPS;
        rebateInBPS = _rebateInBPS;
        epoch = _epoch;
        expiryTimestamp = _expiryTimestamp;
        startTimestamp = now;
    }

    function getLatestNetworkFeeDataWithCache() external override returns (uint256, uint256) {
        data++;
        return (feeBps, expiryTimestamp);
    }

    function getLatestBRRDataWithCache()
        external
        virtual
        override
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (BPS - rewardInBPS - rebateInBPS, rewardInBPS, rebateInBPS, epoch, expiryTimestamp);
    }

    function setStakerPercentageInPrecision(uint256 percentage) external {
        rewardPercentageInPrecision = percentage;
    }

    function getPastEpochRewardPercentageInPrecision(address staker, uint256 forEpoch)
        external
        override
        view
        returns (uint256)
    {
        staker;
        // return 0 for current or future epochs
        if (forEpoch >= epoch) {
            return 0;
        }
        return rewardPercentageInPrecision;
    }

    function getCurrentEpochRewardPercentageInPrecision(address staker)
        external
        override
        view
        returns (uint256)
    {
        staker;
        return rewardPercentageInPrecision;
    }

    function handleWithdrawal(address staker, uint256 reduceAmount) external override {
        staker;
        reduceAmount;
    }

    function vote(uint256 campaignID, uint256 option) external override {
        // must implement so it can be deployed.
        campaignID;
        option;
    }

    function epochPeriodInSeconds() external override view returns (uint256) {
        return epochPeriod;
    }

    function firstEpochStartTimestamp() external override view returns (uint256) {
        return startTimestamp;
    }

    function getCurrentEpochNumber() external override view returns (uint256) {
        return epoch;
    }

    function getEpochNumber(uint256 timestamp) public override view returns (uint256) {
        if (timestamp < startTimestamp || epochPeriod == 0) {
            return 0;
        }
        // ((timestamp - startTimestamp) / epochPeriod) + 1;
        return ((timestamp - startTimestamp) / epochPeriod) + 1;
    }

    function getLatestNetworkFeeData() external override view returns (uint256, uint256) {
        return (feeBps, expiryTimestamp);
    }

    function shouldBurnRewardForEpoch(uint256 epochNum) external override view returns (bool) {
        if (shouldBurnRewardEpoch[epochNum]) return true;
        return false;
    }

    function advanceEpoch() public {
        epoch++;
        expiryTimestamp = now + epochPeriod;
    }

    function setShouldBurnRewardTrue(uint256 epochNum) public {
        shouldBurnRewardEpoch[epochNum] = true;
    }

    function setMockEpochAndExpiryTimestamp(uint256 _epoch, uint256 _expiryTimestamp) public {
        epoch = _epoch;
        expiryTimestamp = _expiryTimestamp;
    }

    function setMockBRR(uint256 _rewardInBPS, uint256 _rebateInBPS) public {
        rewardInBPS = _rewardInBPS;
        rebateInBPS = _rebateInBPS;
    }

    function setNetworkFeeBps(uint256 _feeBps) public {
        feeBps = _feeBps;
    }
}
