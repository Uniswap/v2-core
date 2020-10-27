// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "../VolumeTrendRecorder.sol";

contract MockVolumeTrendRecorder is VolumeTrendRecorder {
    constructor(uint128 _emaInit) public VolumeTrendRecorder(_emaInit) {}

    function mockUpdateEma(uint256 skipBlock) external {
        updateEMA(skipBlock);
    }

    function mockUpdateVolume(
        uint256 value,
        uint256 skipBlock,
        uint256 blockNumber
    ) external {
        updateVolume(value, skipBlock, blockNumber);
    }

    function mockGetRFactor(uint256 blockNumber) external view returns (uint256) {
        return rFactor(blockNumber);
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
}
