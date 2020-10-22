// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "./libraries/Math.sol";
import "./libraries/MathExt.sol";
import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IUniswapV2Callee.sol";
import "./VolumeTrendRecorder.sol";

contract UniswapV2Pair is IUniswapV2Pair, ERC20, ReentrancyGuard, VolumeTrendRecorder {
    using MathExt for uint256;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 public constant override MINIMUM_LIQUIDITY = 10**3;
    bytes4 private constant SELECTOR = bytes4(keccak256(bytes("transfer(address,uint256)")));

    address public override factory;
    IERC20 public override token0;
    IERC20 public override token1;

    uint112 private reserve0; // uses single storage slot, accessible via getReserves
    uint112 private reserve1; // uses single storage slot, accessible via getReserves
    uint32 private blockTimestampLast; // uses single storage slot, accessible via getReserves

    uint256 public override kLast; // reserve0 * reserve1, as of immediately after the most recent liquidity event

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

    constructor() public ERC20("Uniswap V2", "UNI-V2") VolumeTrendRecorder(0) {
        factory = msg.sender;
    }

    // called once by the factory at time of deployment
    function initialize(IERC20 _token0, IERC20 _token1) external override {
        require(msg.sender == factory, "UniswapV2: FORBIDDEN"); // sufficient check
        token0 = _token0;
        token1 = _token1;
    }

    // update reserves and, on the first call per block, price accumulators
    function _update(uint256 balance0, uint256 balance1) private {
        require(balance0 <= uint112(-1) && balance1 <= uint112(-1), "UniswapV2: OVERFLOW");
        uint32 blockTimestamp = uint32(block.timestamp % 2**32);
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = blockTimestamp;
        emit Sync(reserve0, reserve1);
    }

    // if fee is on, mint liquidity equivalent to 1/6th of the growth in sqrt(k)
    function _mintFee(uint112 _reserve0, uint112 _reserve1) private returns (bool feeOn) {
        address feeTo = IUniswapV2Factory(factory).feeTo();
        feeOn = feeTo != address(0);
        uint256 _kLast = kLast; // gas savings
        if (feeOn) {
            if (_kLast != 0) {
                uint256 rootK = Math.sqrt(uint256(_reserve0).mul(_reserve1));
                uint256 rootKLast = Math.sqrt(_kLast);
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

    // this low-level function should be called from a contract which performs important safety checks
    function mint(address to) external override nonReentrant returns (uint256 liquidity) {
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        uint256 amount0 = balance0.sub(_reserve0);
        uint256 amount1 = balance1.sub(_reserve1);

        bool feeOn = _mintFee(_reserve0, _reserve1);
        uint256 _totalSupply = totalSupply(); // gas savings, must be defined here since totalSupply can update in _mintFee
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount0.mul(amount1)).sub(MINIMUM_LIQUIDITY);
            _mint(address(-1), MINIMUM_LIQUIDITY); // permanently lock the first MINIMUM_LIQUIDITY tokens
        } else {
            liquidity = Math.min(
                amount0.mul(_totalSupply) / _reserve0,
                amount1.mul(_totalSupply) / _reserve1
            );
        }
        require(liquidity > 0, "UniswapV2: INSUFFICIENT_LIQUIDITY_MINTED");
        _mint(to, liquidity);

        _update(balance0, balance1);
        if (feeOn) kLast = uint256(reserve0).mul(reserve1); // reserve0 and reserve1 are up-to-date
        emit Mint(msg.sender, amount0, amount1);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function burn(address to)
        external
        override
        nonReentrant
        returns (uint256 amount0, uint256 amount1)
    {
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings
        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));
        uint256 liquidity = balanceOf(address(this));

        bool feeOn = _mintFee(_reserve0, _reserve1);
        uint256 _totalSupply = totalSupply(); // gas savings, must be defined here since totalSupply can update in _mintFee
        amount0 = liquidity.mul(balance0) / _totalSupply; // using balances ensures pro-rata distribution
        amount1 = liquidity.mul(balance1) / _totalSupply; // using balances ensures pro-rata distribution
        require(amount0 > 0 && amount1 > 0, "UniswapV2: INSUFFICIENT_LIQUIDITY_BURNED");
        _burn(address(this), liquidity);
        token0.safeTransfer(to, amount0);
        token1.safeTransfer(to, amount1);
        balance0 = token0.balanceOf(address(this));
        balance1 = token1.balanceOf(address(this));

        _update(balance0, balance1);
        if (feeOn) kLast = uint256(reserve0).mul(reserve1); // reserve0 and reserve1 are up-to-date
        emit Burn(msg.sender, amount0, amount1, to);
    }

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
        uint256 rFactor = rFactor(block.timestamp);
        feeInPrecision = getFee(rFactor);
    }

    // this low-level function should be called from a contract which performs important safety checks
    function swap(
        uint256 amount0Out,
        uint256 amount1Out,
        address to,
        bytes calldata data
    ) external override nonReentrant {
        require(amount0Out > 0 || amount1Out > 0, "UniswapV2: INSUFFICIENT_OUTPUT_AMOUNT");
        (uint256 _reserve0, uint256 _reserve1, ) = getReserves(); // gas savings
        require(
            amount0Out < _reserve0 && amount1Out < _reserve1,
            "UniswapV2: INSUFFICIENT_LIQUIDITY"
        );

        uint256 balance0;
        uint256 balance1;
        {
            // scope for _token{0,1}, avoids stack too deep errors
            require(to != address(token0) && to != address(token1), "UniswapV2: INVALID_TO");
            if (amount0Out > 0) token0.safeTransfer(to, amount0Out); // optimistically transfer tokens
            if (amount1Out > 0) token1.safeTransfer(to, amount1Out); // optimistically transfer tokens
            if (data.length > 0)
                IUniswapV2Callee(to).uniswapV2Call(msg.sender, amount0Out, amount1Out, data);
            balance0 = token0.balanceOf(address(this));
            balance1 = token1.balanceOf(address(this));
        }
        uint256 amount0In = balance0 > _reserve0 - amount0Out
            ? balance0 - (_reserve0 - amount0Out)
            : 0;
        uint256 amount1In = balance1 > _reserve1 - amount1Out
            ? balance1 - (_reserve1 - amount1Out)
            : 0;
        require(amount0In > 0 || amount1In > 0, "UniswapV2: INSUFFICIENT_INPUT_AMOUNT");

        verifyBalanceAndUpdateEma(amount0In, amount1In, _reserve0, _reserve1, balance0, balance1);

        _update(balance0, balance1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    function verifyBalanceAndUpdateEma(
        uint256 _amount0In,
        uint256 _amount1In,
        uint256 _reserve0,
        uint256 _reserve1,
        uint256 _balance0,
        uint256 _balance1
    ) internal virtual {
        uint256 skipWindow = getSkipWindow(now);
        uint256 rFactor = updateEMA(skipWindow);
        uint256 fee = getFee(rFactor);
        uint256 balance0Adjusted = (
            _balance0.mul(MathExt.PRECISION).sub(_amount0In.mul(fee)).div(MathExt.PRECISION)
        );
        uint256 balance1Adjusted = (
            _balance1.mul(MathExt.PRECISION).sub(_amount1In.mul(fee)).div(MathExt.PRECISION)
        );
        require(
            balance0Adjusted.mul(balance1Adjusted) >= _reserve0.mul(_reserve1),
            "UniswapV2: K"
        );
        uint256 volume = _reserve0.mul(_amount1In).div(_reserve1).add(_amount0In);
        updateVolume(volume, skipWindow, now);
    }

    uint256 private constant B = 1567600000000000000; // 1.5676 * 10^18
    uint256 private constant C0 = uint256(10**18 * 30);
    uint256 private constant C1 = uint256(10**18 * 10000) / 27;
    uint256 private constant C2 = uint256(10**18 * 275) / 9;
    uint256 private constant C3 = uint256(10**18 * 455) / 54;

    uint256 private constant A = 9975124378110000000; // 9.97512437811 * 10^18

    function getFee(uint256 rFactor) internal pure returns (uint256) {
        if (rFactor >= B) {
            return (60 * MathExt.PRECISION) / 10000;
        } else if (rFactor >= MathExt.PRECISION) {
            uint256 tmp = rFactor - (MathExt.PRECISION * 5) / 4;
            return
                (C0 +
                    C1.unsafeMulInPercision(tmp.unsafeExpInPercision(3)) +
                    C2.unsafeMulInPercision(tmp) +
                    C3) / 10000;
        } else {
            uint256 tmp = (MathExt.PRECISION * 4) / 5;
            uint256 tmp2 = (rFactor > tmp ? (rFactor - tmp) : (tmp - rFactor))
                .unsafeExpInPercision(2);
            tmp2 = MathExt.PRECISION.mul(tmp2 * 50000).div(10000 * tmp2 + 2 * MathExt.PRECISION);
            if (rFactor > tmp) {
                return (C0 + tmp2 - A) / 10000;
            } else {
                return (C0 - tmp2 - A) / 10000;
            }
        }
    }

    // force balances to match reserves
    // TODO: review later
    function skim(address to) external override nonReentrant {
        token0.safeTransfer(to, token0.balanceOf(address(this)).sub(reserve0));
        token1.safeTransfer(to, token1.balanceOf(address(this)).sub(reserve1));
    }

    // force reserves to match balances
    // TODO: when do token rebase like AMPL, we should also update EMA.
    function sync() external override nonReentrant {
        _update(token0.balanceOf(address(this)), token1.balanceOf(address(this)));
    }
}
