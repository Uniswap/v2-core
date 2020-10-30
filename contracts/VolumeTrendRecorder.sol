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
    uint256 public constant SHORT_ALPHA = (2 * uint256(10)**18) / 5401;
    uint256 public constant LONG_ALPHA = (2 * uint256(10)**18) / 10801;

    uint128 internal shortEMA;
    uint128 internal longEMA;
    // total volume in current block
    uint128 internal currentBlockVolume;
    uint128 internal lastTradeBlock;

    constructor(uint128 _emaInit) public {
        shortEMA = _emaInit;
        longEMA = _emaInit;
        lastTradeBlock = safeUint128(block.number);
    }

    function getVolumeRecorder()
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

    /// @dev records a new trade, update ema and returns current rFactor for this trade
    function recordNewTrade(uint256 blockNumber, uint256 value)
        internal
        returns (uint256 _rFactor)
    {
        // this can not be underflow because block.number always increases
        uint256 skipBlock = blockNumber - lastTradeBlock;
        if (skipBlock == 0) {
            currentBlockVolume = safeUint128(uint256(currentBlockVolume).add(value));
            return calculateRFactor(uint256(shortEMA), uint256(longEMA));
        }

        uint256 _currentBlockVolume = uint256(currentBlockVolume);
        uint256 _shortEMA = newEMA(uint256(shortEMA), SHORT_ALPHA, _currentBlockVolume);
        uint256 _longEMA = newEMA(uint256(longEMA), LONG_ALPHA, _currentBlockVolume);
        // ema = ema * (1-aplha) ^(skipBlock -1)
        _shortEMA = _shortEMA.unsafeMulInPercision(
            (MathExt.PRECISION - SHORT_ALPHA).unsafePowInPercision(skipBlock - 1)
        );
        _longEMA = _longEMA.unsafeMulInPercision(
            (MathExt.PRECISION - LONG_ALPHA).unsafePowInPercision(skipBlock - 1)
        );
        shortEMA = safeUint128(_shortEMA);
        longEMA = safeUint128(_longEMA);
        currentBlockVolume = safeUint128(value);
        lastTradeBlock = safeUint128(blockNumber);

        return calculateRFactor(_shortEMA, _longEMA);
    }

    function getRFactor(uint256 blockNumber) internal view returns (uint256) {
        // this can not be underflow because block.number always increases
        uint256 skipBlock = blockNumber - lastTradeBlock;
        if (skipBlock == 0) {
            return calculateRFactor(shortEMA, longEMA);
        }
        uint256 _currentBlockVolume = currentBlockVolume;
        uint256 _shortEMA = newEMA(uint256(shortEMA), SHORT_ALPHA, _currentBlockVolume);
        uint256 _longEMA = newEMA(uint256(longEMA), LONG_ALPHA, _currentBlockVolume);
        _shortEMA = uint256(_shortEMA).unsafeMulInPercision(
            (MathExt.PRECISION - SHORT_ALPHA).unsafePowInPercision(skipBlock - 1)
        );
        _longEMA = uint256(_longEMA).unsafeMulInPercision(
            (MathExt.PRECISION - LONG_ALPHA).unsafePowInPercision(skipBlock - 1)
        );
        return calculateRFactor(_shortEMA, _longEMA);
    }

    function calculateRFactor(uint256 _shortEMA, uint256 _longEMA)
        internal
        pure
        returns (uint256)
    {
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
