pragma solidity 0.6.6;

import "./libraries/MathExt.sol";

/// @dev contract to calculate volume trend. See secion 3.1 in the white paper
/// @dev EMA stands for Exponential moving average
/// @dev https://en.wikipedia.org/wiki/Moving_average
contract VolumeTrendRecorder {
    using MathExt for uint256;
    using SafeMath for uint256;

    uint256 private constant MAX_UINT128 = 2**128 - 1;
    uint256 internal constant PRECISION = 10**18;
    uint256 private constant SHORT_ALPHA = (2 * PRECISION) / 5401;
    uint256 private constant LONG_ALPHA = (2 * PRECISION) / 10801;

    uint128 internal shortEMA;
    uint128 internal longEMA;
    // total volume in current block
    uint128 internal currentBlockVolume;
    uint128 internal lastTradeBlock;

    event UpdateEMA(uint256 shortEMA, uint256 longEMA, uint128 lastBlockVolume, uint256 skipBlock);

    constructor(uint128 _emaInit) public {
        shortEMA = _emaInit;
        longEMA = _emaInit;
        lastTradeBlock = safeUint128(block.number);
    }

    function getVolumeTrendData()
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
    /// @return rFactor in Precision for this trade
    function recordNewUpdatedVolume(uint256 blockNumber, uint256 value)
        internal
        returns (uint256)
    {
        // this can not be underflow because block.number always increases
        uint256 skipBlock = blockNumber - lastTradeBlock;
        if (skipBlock == 0) {
            currentBlockVolume = safeUint128(
                uint256(currentBlockVolume).add(value),
                "volume exceeds valid range"
            );
            return calculateRFactor(uint256(shortEMA), uint256(longEMA));
        }
        uint128 _currentBlockVolume = currentBlockVolume;
        uint256 _shortEMA = newEMA(shortEMA, SHORT_ALPHA, currentBlockVolume);
        uint256 _longEMA = newEMA(longEMA, LONG_ALPHA, currentBlockVolume);
        // ema = ema * (1-aplha) ^(skipBlock -1)
        _shortEMA = _shortEMA.mulInPrecision(
            (PRECISION - SHORT_ALPHA).unsafePowInPrecision(skipBlock - 1)
        );
        _longEMA = _longEMA.mulInPrecision(
            (PRECISION - LONG_ALPHA).unsafePowInPrecision(skipBlock - 1)
        );
        shortEMA = safeUint128(_shortEMA);
        longEMA = safeUint128(_longEMA);
        currentBlockVolume = safeUint128(value);
        lastTradeBlock = safeUint128(blockNumber);

        emit UpdateEMA(_shortEMA, _longEMA, _currentBlockVolume, skipBlock);

        return calculateRFactor(_shortEMA, _longEMA);
    }

    /// @return rFactor in Precision for this trade
    function getRFactor(uint256 blockNumber) internal view returns (uint256) {
        // this can not be underflow because block.number always increases
        uint256 skipBlock = blockNumber - lastTradeBlock;
        if (skipBlock == 0) {
            return calculateRFactor(shortEMA, longEMA);
        }
        uint256 _shortEMA = newEMA(shortEMA, SHORT_ALPHA, currentBlockVolume);
        uint256 _longEMA = newEMA(longEMA, LONG_ALPHA, currentBlockVolume);
        _shortEMA = _shortEMA.mulInPrecision(
            (PRECISION - SHORT_ALPHA).unsafePowInPrecision(skipBlock - 1)
        );
        _longEMA = _longEMA.mulInPrecision(
            (PRECISION - LONG_ALPHA).unsafePowInPrecision(skipBlock - 1)
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
    /// @param ema previous ema value in wei
    /// @param alpha in Precicion (required < Precision)
    /// @param value current value to update ema
    /// @dev ema and value is uint128 and alpha < Percison
    /// @dev so this function can not overflow and returned ema is not overflow uint128
    function newEMA(
        uint128 ema,
        uint256 alpha,
        uint128 value
    ) internal pure returns (uint256) {
        assert(alpha < PRECISION);
        return ((PRECISION - alpha) * uint256(ema) + alpha * uint256(value)) / PRECISION;
    }

    function safeUint128(uint256 v) internal pure returns (uint128) {
        require(v <= MAX_UINT128, "overflow uint128");
        return uint128(v);
    }

    function safeUint128(uint256 v, string memory errorMessage) internal pure returns (uint128) {
        require(v <= MAX_UINT128, errorMessage);
        return uint128(v);
    }
}
