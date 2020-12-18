pragma solidity 0.6.6;

import "../VolumeTrendRecorder.sol";

contract MockVolumeTrendRecorder is VolumeTrendRecorder {
    constructor(uint128 _emaInit) public VolumeTrendRecorder(_emaInit) {}

    function mockRecordNewUpdatedVolume(uint256 value, uint256 blockNumber) external {
        recordNewUpdatedVolume(blockNumber, value);
    }

    function mockGetRFactor(uint256 blockNumber) external view returns (uint256) {
        return getRFactor(blockNumber);
    }

    function testGasCostGetRFactor(uint256 blockNumber) external view returns (uint256) {
        uint256 gas1 = gasleft();
        getRFactor(blockNumber);
        return gas1 - gasleft();
    }

    function mockGetInfo()
        external
        view
        returns (
            uint128 _shortEMA,
            uint128 _longEMA,
            uint128 _currentBlockVolume,
            uint128 _lastTradeBlock
        )
    {
        _shortEMA = shortEMA;
        _longEMA = longEMA;
        _currentBlockVolume = currentBlockVolume;
        _lastTradeBlock = lastTradeBlock;
    }

    function mockSafeUint128(uint256 a) external pure returns (uint128) {
        return safeUint128(a);
    }
}
