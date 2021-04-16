// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

import "../interfaces/IDMMLiquidityRouter.sol";
import "../interfaces/IERC20Permit.sol";

interface ILiquidityMigrator {
    struct PermitData {
        bool approveMax;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct PoolInfo {
        address poolAddress;
        uint32 poolAmp;
    }

    event RemoveLiquidity(
        address indexed tokenA,
        address indexed tokenB,
        address indexed uniPair,
        uint256 liquidity,
        uint256 amountA,
        uint256 amountB
    );

    event Migrated(
        address indexed tokenA,
        address indexed tokenB,
        uint256 dmmAmountA,
        uint256 dmmAmountB,
        uint256 dmmLiquidity,
        PoolInfo info
    );

    /**
     * @dev Migrate tokens from a pair to a Kyber Dmm Pool
     *   Supporting both normal tokens and tokens with fee on transfer
     *   Support create new pool with received tokens from removing, or
     *       add tokens to a given pool address
     * @param uniPair pair for token that user wants to migrate from
     *   it should be compatible with UniswapPair's interface
     * @param tokenA first token of the pool
     * @param tokenB second token of the pool
     * @param liquidity amount of LP tokens to migrate
     * @param amountAMin min amount for tokenA when removing
     * @param amountBMin min amount for tokenB when removing
     * @param dmmAmountAMin min amount for tokenA when adding
     * @param dmmAmountBMin min amount for tokenB when adding
     * @param poolInfo info the the Kyber DMM Pool - (poolAddress, poolAmp)
     *   if poolAddress is 0x0 -> create new pool with amp factor of poolAmp
     *   otherwise add liquidity to poolAddress
     * @param deadline only allow transaction to be executed before the deadline
     */
    function migrateLpToDmmPool(
        address uniPair,
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        uint256 dmmAmountAMin,
        uint256 dmmAmountBMin,
        PoolInfo calldata poolInfo,
        uint256 deadline
    )
        external
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 addedLiquidity
        );

    /**
     * @dev Migrate tokens from a pair to a Kyber Dmm Pool with permit
     *   User doesn't have to make an approve allowance transaction, just need to sign the data
     *   Supporting both normal tokens and tokens with fee on transfer
     *   Support create new pool with received tokens from removing, or
     *       add tokens to a given pool address
     * @param uniPair pair for token that user wants to migrate from
     *   it should be compatible with UniswapPair's interface
     * @param tokenA first token of the pool
     * @param tokenB second token of the pool
     * @param liquidity amount of LP tokens to migrate
     * @param amountAMin min amount for tokenA when removing
     * @param amountBMin min amount for tokenB when removing
     * @param dmmAmountAMin min amount for tokenA when adding
     * @param dmmAmountBMin min amount for tokenB when adding
     * @param poolInfo info the the Kyber DMM Pool - (poolAddress, poolAmp)
     *   if poolAddress is 0x0 -> create new pool with amp factor of poolAmp
     *   otherwise add liquidity to poolAddress
     * @param deadline only allow transaction to be executed before the deadline
     * @param permitData data of approve allowance
     */
    function migrateLpToDmmPoolWithPermit(
        address uniPair,
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        uint256 dmmAmountAMin,
        uint256 dmmAmountBMin,
        PoolInfo calldata poolInfo,
        uint256 deadline,
        PermitData calldata permitData
    )
        external
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 addedLiquidity
        );
}

/**
 * @dev Liquidity Migrator contract to help migrating liquidity
 *       from other sources to Kyber DMM Pool
 */
contract LiquidityMigrator is ILiquidityMigrator, Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    address public immutable dmmRouter;

    constructor(address _dmmRouter) public {
        require(_dmmRouter != address(0), "Migrator: INVALID_ROUTER");
        dmmRouter = _dmmRouter;
    }

    /**
     * @dev Use only for some special tokens
     */
    function manualApproveAllowance(
        IERC20[] calldata tokens,
        address[] calldata spenders,
        uint256 allowance
    ) external onlyOwner {
        for (uint256 i = 0; i < tokens.length; i++) {
            for (uint256 j = 0; j < spenders.length; j++) {
                tokens[i].safeApprove(spenders[j], allowance);
            }
        }
    }

    /**
     * @dev Migrate tokens from a pair to a Kyber Dmm Pool
     *   Supporting both normal tokens and tokens with fee on transfer
     *   Support create new pool with received tokens from removing, or
     *       add tokens to a given pool address
     * @param uniPair pair for token that user wants to migrate from
     *   it should be compatible with UniswapPair's interface
     * @param tokenA first token of the pool
     * @param tokenB second token of the pool
     * @param liquidity amount of LP tokens to migrate
     * @param amountAMin min amount for tokenA when removing/adding
     * @param amountBMin min amount for tokenB when removing/adding
     * @param poolInfo info the the Kyber DMM Pool - (poolAddress, poolAmp)
     *   if poolAddress is 0x0 -> create new pool with amp factor of poolAmp
     *   otherwise add liquidity to poolAddress
     * @param deadline only allow transaction to be executed before the deadline
     * @param permitData data of approve allowance
     */
    function migrateLpToDmmPoolWithPermit(
        address uniPair,
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        uint256 dmmAmountAMin,
        uint256 dmmAmountBMin,
        PoolInfo calldata poolInfo,
        uint256 deadline,
        PermitData calldata permitData
    )
        external
        override
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 addedLiquidity
        )
    {
        IERC20Permit(uniPair).permit(
            msg.sender,
            address(this),
            permitData.approveMax ? uint256(-1) : liquidity,
            deadline,
            permitData.v,
            permitData.r,
            permitData.s
        );

        (amountA, amountB, addedLiquidity) = migrateLpToDmmPool(
            uniPair,
            tokenA,
            tokenB,
            liquidity,
            amountAMin,
            amountBMin,
            dmmAmountAMin,
            dmmAmountBMin,
            poolInfo,
            deadline
        );
    }

    /**
     * @dev Migrate tokens from a pair to a Kyber Dmm Pool with permit
     *   User doesn't have to make an approve allowance transaction, just need to sign the data
     *   Supporting both normal tokens and tokens with fee on transfer
     *   Support create new pool with received tokens from removing, or
     *       add tokens to a given pool address
     * @param uniPair pair for token that user wants to migrate from
     *   it should be compatible with UniswapPair's interface
     * @param tokenA first token of the pool
     * @param tokenB second token of the pool
     * @param liquidity amount of LP tokens to migrate
     * @param amountAMin min amount for tokenA when removing/adding
     * @param amountBMin min amount for tokenB when removing/adding
     * @param poolInfo info the the Kyber DMM Pool - (poolAddress, poolAmp)
     *   if poolAddress is 0x0 -> create new pool with amp factor of poolAmp
     *   otherwise add liquidity to poolAddress
     * @param deadline only allow transaction to be executed before the deadline
     */
    function migrateLpToDmmPool(
        address uniPair,
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        uint256 dmmAmountAMin,
        uint256 dmmAmountBMin,
        PoolInfo memory poolInfo,
        uint256 deadline
    )
        public
        override
        returns (
            uint256 dmmAmountA,
            uint256 dmmAmountB,
            uint256 dmmLiquidity
        )
    {
        // support for both normal token and token with fee on transfer
        {
            uint256 balanceTokenA = IERC20(tokenA).balanceOf(address(this));
            uint256 balanceTokenB = IERC20(tokenB).balanceOf(address(this));
            _removeUniLiquidity(
                uniPair,
                tokenA,
                tokenB,
                liquidity,
                amountAMin,
                amountBMin,
                deadline
            );
            dmmAmountA = IERC20(tokenA).balanceOf(address(this)).sub(balanceTokenA);
            dmmAmountB = IERC20(tokenB).balanceOf(address(this)).sub(balanceTokenB);
            require(dmmAmountA > 0 && dmmAmountB > 0, "Migrator: INVALID_AMOUNT");

            emit RemoveLiquidity(tokenA, tokenB, uniPair, liquidity, dmmAmountA, dmmAmountB);
        }

        (dmmAmountA, dmmAmountB, dmmLiquidity) = _addLiquidityToDmmPool(
            tokenA,
            tokenB,
            dmmAmountA,
            dmmAmountB,
            dmmAmountAMin,
            dmmAmountBMin,
            poolInfo,
            deadline
        );

        emit Migrated(tokenA, tokenB, dmmAmountA, dmmAmountB, dmmLiquidity, poolInfo);
    }

    /** @dev Allow the Owner to withdraw any funds that have been 'wrongly'
     *       transferred to the migrator contract
     */
    function withdrawFund(IERC20 token, uint256 amount) external onlyOwner {
        if (token == IERC20(0)) {
            (bool success, ) = owner().call{value: amount}("");
            require(success, "Migrator: TRANSFER_ETH_FAILED");
        } else {
            token.safeTransfer(owner(), amount);
        }
    }

    /**
     * @dev Add liquidity to Kyber dmm pool, support adding to new pool or an existing pool
     */
    function _addLiquidityToDmmPool(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        PoolInfo memory poolInfo,
        uint256 deadline
    )
        internal
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        )
    {
        // safe approve only if needed
        _safeApproveAllowance(IERC20(tokenA), address(dmmRouter));
        _safeApproveAllowance(IERC20(tokenB), address(dmmRouter));
        if (poolInfo.poolAddress == address(0)) {
            // add to new pool
            (amountA, amountB, liquidity) = _addLiquidityNewPool(
                tokenA,
                tokenB,
                amountADesired,
                amountBDesired,
                amountAMin,
                amountBMin,
                poolInfo.poolAmp,
                deadline
            );
        } else {
            (amountA, amountB, liquidity) = _addLiquidityExistingPool(
                tokenA,
                tokenB,
                amountADesired,
                amountBDesired,
                amountAMin,
                amountBMin,
                poolInfo.poolAddress,
                deadline
            );
        }
    }

    /**
     * @dev Add liquidity to an existing pool, and return back tokens to users if any
     */
    function _addLiquidityExistingPool(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address dmmPool,
        uint256 deadline
    )
        internal
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        )
    {
        (amountA, amountB, liquidity) = IDMMLiquidityRouter(dmmRouter).addLiquidity(
            IERC20(tokenA),
            IERC20(tokenB),
            dmmPool,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            msg.sender,
            deadline
        );
        // return back token if needed
        if (amountA < amountADesired) {
            IERC20(tokenA).safeTransfer(msg.sender, amountADesired - amountA);
        }
        if (amountB < amountBDesired) {
            IERC20(tokenB).safeTransfer(msg.sender, amountBDesired - amountB);
        }
    }

    /**
     * @dev Add liquidity to a new pool, and return back tokens to users if any
     */
    function _addLiquidityNewPool(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        uint32 amps,
        uint256 deadline
    )
        internal
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        )
    {
        (amountA, amountB, liquidity) = IDMMLiquidityRouter(dmmRouter).addLiquidityNewPool(
            IERC20(tokenA),
            IERC20(tokenB),
            amps,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            msg.sender,
            deadline
        );
        // return back token if needed
        if (amountA < amountADesired) {
            IERC20(tokenA).safeTransfer(msg.sender, amountADesired - amountA);
        }
        if (amountB < amountBDesired) {
            IERC20(tokenB).safeTransfer(msg.sender, amountBDesired - amountB);
        }
    }

    /**
     * @dev Re-write remove liquidity function from Uniswap
     */
    function _removeUniLiquidity(
        address pair,
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        uint256 deadline
    ) internal {
        require(deadline >= block.timestamp, "Migratior: EXPIRED");
        IERC20(pair).safeTransferFrom(msg.sender, pair, liquidity); // send liquidity to pair
        (uint256 amount0, uint256 amount1) = IUniswapV2Pair(pair).burn(address(this));
        (address token0, ) = _sortTokens(tokenA, tokenB);
        (uint256 amountA, uint256 amountB) = tokenA == token0
            ? (amount0, amount1)
            : (amount1, amount0);
        require(amountA >= amountAMin, "Migratior: UNI_INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "Migratior: UNI_INSUFFICIENT_B_AMOUNT");
    }

    /**
     * @dev only approve if the current allowance is 0
     */
    function _safeApproveAllowance(IERC20 token, address spender) internal {
        if (token.allowance(address(this), spender) == 0) {
            token.safeApprove(spender, uint256(-1));
        }
    }

    /**
     * @dev Copy logic of sort token from Uniswap lib
     */
    function _sortTokens(address tokenA, address tokenB)
        internal
        pure
        returns (address token0, address token1)
    {
        require(tokenA != tokenB, "Migrator: IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "Migrator: ZERO_ADDRESS");
    }
}
