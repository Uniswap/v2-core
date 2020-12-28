pragma solidity 0.6.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "./libraries/MathExt.sol";
import "./libraries/FeeFomula.sol";
import "./libraries/ERC20Permit.sol";
import "./interfaces/IXYZSwapPair.sol";
import "./interfaces/IXYZSwapFactory.sol";
import "./interfaces/IXYZSwapCallee.sol";
import "./VolumeTrendRecorder.sol";

contract XYZSwapPair is IXYZSwapPair, ERC20Permit, ReentrancyGuard, VolumeTrendRecorder {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 public constant MINIMUM_LIQUIDITY = 10**3;

    address public factory;
    IERC20 public token0;
    IERC20 public token1;

    /// @dev uses single storage slot, accessible via getReserves
    uint112 internal reserve0;
    uint112 internal reserve1;
    uint32 internal blockTimestampLast;
    /// @dev reserve0 * reserve1, as of immediately after the most recent liquidity event
    uint256 public kLast;

    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);

    constructor() public ERC20Permit("XYZSwap LP", "XYZ-LP", "1") VolumeTrendRecorder(0) {
        factory = msg.sender;
    }

    // called once by the factory at time of deployment
    function initialize(IERC20 _token0, IERC20 _token1) external override {
        require(msg.sender == factory, "XYZSwap: FORBIDDEN"); // sufficient check
        token0 = _token0;
        token1 = _token1;
    }

    /// @dev this low-level function should be called from a contract
    ///                 which performs important safety checks
    function mint(address to) external override nonReentrant returns (uint256 liquidity) {
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings
        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));
        uint256 amount0 = balance0.sub(_reserve0);
        uint256 amount1 = balance1.sub(_reserve1);

        bool feeOn = _mintFee(_reserve0, _reserve1);
        uint256 _totalSupply = totalSupply(); // gas savings, must be defined here since totalSupply can update in _mintFee
        if (_totalSupply == 0) {
            liquidity = MathExt.sqrt(amount0.mul(amount1)).sub(MINIMUM_LIQUIDITY);
            _mint(address(-1), MINIMUM_LIQUIDITY); // permanently lock the first MINIMUM_LIQUIDITY tokens
        } else {
            liquidity = Math.min(
                amount0.mul(_totalSupply) / _reserve0,
                amount1.mul(_totalSupply) / _reserve1
            );
        }
        require(liquidity > 0, "XYZSwap: INSUFFICIENT_LIQUIDITY_MINTED");
        _mint(to, liquidity);

        _update(balance0, balance1);
        if (feeOn) kLast = uint256(reserve0).mul(reserve1); // reserve0 and reserve1 are up-to-date
        emit Mint(msg.sender, amount0, amount1);
    }

    /// @dev this low-level function should be called from a contract
    ///           which performs important safety checks
    /// @dev user must transfer LP token to this contract before call burn
    function burn(address to)
        external
        override
        nonReentrant
        returns (uint256 amount0, uint256 amount1)
    {
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings
        IERC20 _token0 = token0; // gas savings
        IERC20 _token1 = token1; // gas savings

        uint256 balance0 = _token0.balanceOf(address(this));
        uint256 balance1 = _token1.balanceOf(address(this));
        uint256 liquidity = balanceOf(address(this));

        bool feeOn = _mintFee(_reserve0, _reserve1);
        uint256 _totalSupply = totalSupply(); // gas savings, must be defined here since totalSupply can update in _mintFee
        amount0 = liquidity.mul(balance0) / _totalSupply; // using balances ensures pro-rata distribution
        amount1 = liquidity.mul(balance1) / _totalSupply; // using balances ensures pro-rata distribution
        require(amount0 > 0 && amount1 > 0, "XYZSwap: INSUFFICIENT_LIQUIDITY_BURNED");
        _burn(address(this), liquidity);
        _token0.safeTransfer(to, amount0);
        _token1.safeTransfer(to, amount1);
        balance0 = _token0.balanceOf(address(this));
        balance1 = _token1.balanceOf(address(this));

        _update(balance0, balance1);
        if (feeOn) kLast = uint256(reserve0).mul(reserve1); // reserve0 and reserve1 are up-to-date
        emit Burn(msg.sender, amount0, amount1, to);
    }

    /// @dev this low-level function should be called from a contract
    ///             which performs important safety checks
    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to,
        bytes calldata data
    ) external override nonReentrant {
        require(amount0Out > 0 || amount1Out > 0, "XYZSwap: INSUFFICIENT_OUTPUT_AMOUNT");
        (uint256 _reserve0, uint256 _reserve1, ) = getReserves(); // gas savings
        require(
            amount0Out < _reserve0 && amount1Out < _reserve1,
            "XYZSwap: INSUFFICIENT_LIQUIDITY"
        );

        uint256 balance0;
        uint256 balance1;
        {
            // scope for _token{0,1}, avoids stack too deep errors
            IERC20 _token0 = token0;
            IERC20 _token1 = token1;
            require(to != address(_token0) && to != address(_token1), "XYZSwap: INVALID_TO");
            if (amount0Out > 0) _token0.safeTransfer(to, amount0Out); // optimistically transfer tokens
            if (amount1Out > 0) _token1.safeTransfer(to, amount1Out); // optimistically transfer tokens
            if (data.length > 0)
                IXYZSwapCallee(to).xyzSwapCall(msg.sender, amount0Out, amount1Out, data);
            balance0 = _token0.balanceOf(address(this));
            balance1 = _token1.balanceOf(address(this));
        }
        uint256 amount0In = balance0 > _reserve0 - amount0Out
            ? balance0 - (_reserve0 - amount0Out)
            : 0;
        uint256 amount1In = balance1 > _reserve1 - amount1Out
            ? balance1 - (_reserve1 - amount1Out)
            : 0;
        require(amount0In > 0 || amount1In > 0, "XYZSwap: INSUFFICIENT_INPUT_AMOUNT");

        verifyBalanceAndUpdateEma(amount0In, amount1In, _reserve0, _reserve1, balance0, balance1);

        _update(balance0, balance1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    /// @dev force balances to match reserves
    function skim(address to) external nonReentrant {
        token0.safeTransfer(to, token0.balanceOf(address(this)).sub(reserve0));
        token1.safeTransfer(to, token1.balanceOf(address(this)).sub(reserve1));
    }

    /// @dev force reserves to match balances
    function sync() external nonReentrant {
        // in case of token like AMPL, we should also update EMA.
        uint256 _reserve0 = reserve0;
        uint256 _newReserve0 = token0.balanceOf(address(this));
        shortEMA = safeUint128(uint256(shortEMA).mul(_newReserve0).div(_reserve0));
        longEMA = safeUint128(uint256(longEMA).mul(_newReserve0).div(_reserve0));

        _update(_newReserve0, token1.balanceOf(address(this)));
    }

    /// @dev returns data to calculate amountIn, amountOut
    function getTradeInfo()
        external
        virtual
        override
        view
        returns (
            uint112 _reserve0,
            uint112 _reserve1,
            uint256 feeInPrecision
        )
    {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        uint256 rFactorInPrecision = getRFactor(block.number);
        feeInPrecision = FeeFomula.getFee(rFactorInPrecision);
    }

    /// @dev returns reserve data to calculate quote amount
    function getReserves()
        public
        override
        view
        returns (
            uint112 _reserve0,
            uint112 _reserve1,
            uint32 _blockTimestampLast
        )
    {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    function verifyBalanceAndUpdateEma(
        uint256 _amount0In,
        uint256 _amount1In,
        uint256 _reserve0,
        uint256 _reserve1,
        uint256 _balance0,
        uint256 _balance1
    ) internal virtual returns (uint256 feeInPrecision) {
        // volume will be normalized into amount in token 0
        uint256 volume = _reserve0.mul(_amount1In).div(_reserve1).add(_amount0In);
        uint256 rFactorInPrecision = recordNewUpdatedVolume(block.number, volume);
        feeInPrecision = FeeFomula.getFee(rFactorInPrecision);
        //verify balance update is match with fomula
        uint256 balance0Adjusted = _balance0.mul(PRECISION).sub(_amount0In.mul(feeInPrecision));
        balance0Adjusted = balance0Adjusted.div(PRECISION);
        uint256 balance1Adjusted = _balance1.mul(PRECISION).sub(_amount1In.mul(feeInPrecision));
        balance1Adjusted = balance1Adjusted.div(PRECISION);
        require(balance0Adjusted.mul(balance1Adjusted) >= _reserve0.mul(_reserve1), "XYZSwap: K");
    }

    /// @dev update reserves and, on the first call per block, price accumulators
    function _update(uint256 balance0, uint256 balance1) internal {
        require(balance0 <= uint112(-1) && balance1 <= uint112(-1), "XYZSwap: OVERFLOW");
        uint32 blockTimestamp = uint32(block.timestamp % 2**32);
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = blockTimestamp;
        emit Sync(reserve0, reserve1);
    }

    /// @dev if fee is on, mint liquidity equivalent to 1/6th of the growth in sqrt(k)
    function _mintFee(uint112 _reserve0, uint112 _reserve1) internal returns (bool feeOn) {
        address feeTo = IXYZSwapFactory(factory).feeTo();
        feeOn = feeTo != address(0);
        uint256 _kLast = kLast; // gas savings
        if (feeOn) {
            if (_kLast != 0) {
                uint256 rootK = MathExt.sqrt(uint256(_reserve0).mul(_reserve1));
                uint256 rootKLast = MathExt.sqrt(_kLast);
                if (rootK > rootKLast) {
                    uint256 numerator = totalSupply().mul(rootK.sub(rootKLast));
                    uint256 denominator = rootK.mul(5).add(rootKLast);
                    uint256 liquidity = numerator / denominator;
                    if (liquidity > 0) _mint(feeTo, liquidity);
                }
            }
        } else if (_kLast != 0) {
            kLast = 0;
        }
    }
}
