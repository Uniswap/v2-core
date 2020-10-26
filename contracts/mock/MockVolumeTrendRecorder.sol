// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "../VolumeTrendRecorder.sol";

contract MockVolumeTrendRecorder is VolumeTrendRecorder {
    constructor(uint128 _emaInit) public VolumeTrendRecorder(_emaInit) {}

    function mockUpdateEma(uint256 skipWindow) external {
        updateEMA(skipWindow);
    }

    function mockUpdateVolume(
        uint256 value,
        uint256 skipWindow,
        uint256 timeStamp
    ) external {
        updateVolume(value, skipWindow, timeStamp);
    }

    function mockGetRFactor(uint256 timeStamp) external view returns (uint256) {
        return rFactor(timeStamp);
    }
}
