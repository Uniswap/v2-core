// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "./libraries/MathExt.sol";

/**
 *   @dev contract to calculate volume trend
 */
contract VolumeTrendRecorder {
    using MathExt for uint256;
    using SafeMath for uint256;

    uint256 internal constant MAX_UINT128 = 1 << (128 - 1);

    uint256 public constant LONG_ALPHA = 74074074074074074; // precision * 2 / 27
    uint256 public constant SHORT_ALPHA = 153846153846153846; // precision * 2/ 13
    uint256 public constant TIME_WINDOW_SIZE = 2 hours;

    uint128 internal shortEMA;
    uint128 internal longEMA;
    // total volume in current time window
    uint128 internal currentEpochVolume;
    uint128 internal lastTimeStamp;

    constructor(uint128 _emaInit) public {
        shortEMA = _emaInit;
        longEMA = _emaInit;
        lastTimeStamp = safeUint128((block.timestamp / TIME_WINDOW_SIZE) * TIME_WINDOW_SIZE);
    }

    function getVolumeRecorder()
        external
        view
        returns (
            uint128 _shortEMA,
            uint128 _longEMA,
            uint128 _currentEpochVolume,
            uint128 _lastTimeStamp
        )
    {
        _shortEMA = shortEMA;
        _longEMA = longEMA;
        _currentEpochVolume = currentEpochVolume;
        _lastTimeStamp = lastTimeStamp;
    }

    function getSkipWindow(uint256 timeStamp) internal view returns (uint256 skipWindow) {
        uint256 normalizedTimestamp = (timeStamp / TIME_WINDOW_SIZE) * TIME_WINDOW_SIZE;
        skipWindow = (normalizedTimestamp - lastTimeStamp) / TIME_WINDOW_SIZE;
    }

    function updateEMA(uint256 skipWindow) internal returns (uint256 _rFactor) {
        if (skipWindow == 0) {
            if (longEMA == 0) {
                return 0;
            }
            return (uint256(shortEMA) * MathExt.PRECISION) / uint256(longEMA);
        }
        uint256 _currentEpochVolume = uint256(currentEpochVolume);
        uint256 _shortEMA = newEMA(uint256(shortEMA), SHORT_ALPHA, _currentEpochVolume);
        uint256 _longEMA = newEMA(uint256(longEMA), LONG_ALPHA, _currentEpochVolume);
        // ema = ema * (1-aplha) ^(skipWindow -1)
        _shortEMA = _shortEMA.unsafeMulInPercision(
            (MathExt.PRECISION - SHORT_ALPHA).unsafeExpInPercision(skipWindow - 1)
        );
        _longEMA = _longEMA.unsafeMulInPercision(
            (MathExt.PRECISION - LONG_ALPHA).unsafeExpInPercision(skipWindow - 1)
        );
        shortEMA = safeUint128(_shortEMA);
        longEMA = safeUint128(_longEMA);
        if (_longEMA == 0) {
            return 0;
        }

        return (_shortEMA * MathExt.PRECISION) / _longEMA;
    }

    function updateVolume(
        uint256 value,
        uint256 skipWindow,
        uint256 timeStamp
    ) internal {
        if (skipWindow == 0) {
            currentEpochVolume = safeUint128(value.add(uint256(currentEpochVolume)));
        } else {
            currentEpochVolume = safeUint128(value);
            uint256 normalizedTimestamp = (timeStamp / TIME_WINDOW_SIZE) * TIME_WINDOW_SIZE;
            lastTimeStamp = safeUint128(normalizedTimestamp);
        }
    }

    function rFactor(uint256 timeStamp) internal view returns (uint256) {
        uint256 normalizedTimestamp = (timeStamp / TIME_WINDOW_SIZE) * TIME_WINDOW_SIZE;
        uint256 skipWindow = (normalizedTimestamp - lastTimeStamp) / TIME_WINDOW_SIZE;

        if (skipWindow == 0) {
            if (longEMA == 0) {
                return 0;
            }
            return (uint256(shortEMA) * MathExt.PRECISION) / uint256(longEMA);
        }
        uint256 _currentEpochVolume = currentEpochVolume;
        uint256 _shortEMA = newEMA(uint256(shortEMA), SHORT_ALPHA, _currentEpochVolume);
        uint256 _longEMA = newEMA(uint256(longEMA), LONG_ALPHA, _currentEpochVolume);
        _shortEMA = uint256(_shortEMA).unsafeMulInPercision(
            (MathExt.PRECISION - SHORT_ALPHA).unsafeExpInPercision(skipWindow - 1)
        );
        _longEMA = uint256(_longEMA).unsafeMulInPercision(
            (MathExt.PRECISION - LONG_ALPHA).unsafeExpInPercision(skipWindow - 1)
        );
        if (_longEMA == 0) {
            return 0;
        }
        return (_shortEMA * MathExt.PRECISION) / _longEMA;
    }

    /// @dev return newEMA value
    /// @param _ema previous ema value in wei
    /// @param alpha in Percision
    /// @param value current value to update ema
    /// @dev assume _ema < 2 ** 128 - 1 and alpha < Percison and value < 2 ** 128 -1
    /// then this can not overflow and ema < 2**128 - 1
    function newEMA(
        uint256 _ema,
        uint256 alpha,
        uint256 value
    ) internal pure returns (uint256 ema) {
        return ((MathExt.PRECISION - alpha) * _ema + alpha * value) / MathExt.PRECISION;
    }

    function safeUint128(uint256 v) internal pure returns (uint128) {
        require(v < MAX_UINT128, "overflow uint128");
        return uint128(v);
    }
}
