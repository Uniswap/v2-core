// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @dev an simple interface for integration dApp to contribute liquidity
interface IKSLiquidityRouter {
    /**
     * @param tokenA address of token in the pool
     * @param tokenB address of token in the pool
     * @param pool the address of the pool
     * @param amountADesired the amount of tokenA users want to add to the pool
     * @param amountBDesired the amount of tokenB users want to add to the pool
     * @param amountAMin bounds to the extents to which amountB/amountA can go up
     * @param amountBMin bounds to the extents to which amountB/amountA can go down
     * @param vReserveRatioBounds bounds to the extents to which vReserveB/vReserveA can go (precision: 2 ** 112)
     * @param to Recipient of the liquidity tokens.
     * @param deadline Unix timestamp after which the transaction will revert.
     */
    function addLiquidity(
        IERC20 tokenA,
        IERC20 tokenB,
        address pool,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        uint256[2] calldata vReserveRatioBounds,
        address to,
        uint256 deadline
    )
        external
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        );

    function addLiquidityNewPool(
        IERC20 tokenA,
        IERC20 tokenB,
        uint32[2] memory ampBpsAndFeeBps,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        );

    function addLiquidityNewPoolETH(
        IERC20 token,
        uint32[2] memory ampBpsAndFeeBps,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    )
        external
        payable
        returns (
            uint256 amountToken,
            uint256 amountETH,
            uint256 liquidity
        );

    /**
     * @param token address of token in the pool
     * @param pool the address of the pool
     * @param amountTokenDesired the amount of token users want to add to the pool
     * @dev   msg.value equals to amountEthDesired
     * @param amountTokenMin bounds to the extents to which WETH/token can go up
     * @param amountETHMin bounds to the extents to which WETH/token can go down
     * @param vReserveRatioBounds bounds to the extents to which vReserveB/vReserveA can go (precision: 2 ** 112)
     * @param to Recipient of the liquidity tokens.
     * @param deadline Unix timestamp after which the transaction will revert.
     */
    function addLiquidityETH(
        IERC20 token,
        address pool,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        uint256[2] calldata vReserveRatioBounds,
        address to,
        uint256 deadline
    )
        external
        payable
        returns (
            uint256 amountToken,
            uint256 amountETH,
            uint256 liquidity
        );

    /**
     * @param tokenA address of token in the pool
     * @param tokenB address of token in the pool
     * @param pool the address of the pool
     * @param liquidity the amount of lp token users want to burn
     * @param amountAMin the minimum token retuned after burning
     * @param amountBMin the minimum token retuned after burning
     * @param to Recipient of the returned tokens.
     * @param deadline Unix timestamp after which the transaction will revert.
     */
    function removeLiquidity(
        IERC20 tokenA,
        IERC20 tokenB,
        address pool,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB);

    /**
     * @param tokenA address of token in the pool
     * @param tokenB address of token in the pool
     * @param pool the address of the pool
     * @param liquidity the amount of lp token users want to burn
     * @param amountAMin the minimum token retuned after burning
     * @param amountBMin the minimum token retuned after burning
     * @param to Recipient of the returned tokens.
     * @param deadline Unix timestamp after which the transaction will revert.
     * @param approveMax whether users permit the router spending max lp token or not.
     * @param r s v Signature of user to permit the router spending lp token
     */
    function removeLiquidityWithPermit(
        IERC20 tokenA,
        IERC20 tokenB,
        address pool,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline,
        bool approveMax,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (uint256 amountA, uint256 amountB);

    /**
     * @param token address of token in the pool
     * @param pool the address of the pool
     * @param liquidity the amount of lp token users want to burn
     * @param amountTokenMin the minimum token retuned after burning
     * @param amountETHMin the minimum eth in wei retuned after burning
     * @param to Recipient of the returned tokens.
     * @param deadline Unix timestamp after which the transaction will revert
     */
    function removeLiquidityETH(
        IERC20 token,
        address pool,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountToken, uint256 amountETH);

    /**
     * @param token address of token in the pool
     * @param pool the address of the pool
     * @param liquidity the amount of lp token users want to burn
     * @param amountTokenMin the minimum token retuned after burning
     * @param amountETHMin the minimum eth in wei retuned after burning
     * @param to Recipient of the returned tokens.
     * @param deadline Unix timestamp after which the transaction will revert
     * @param approveMax whether users permit the router spending max lp token
     * @param r s v signatures of user to permit the router spending lp token.
     */
    function removeLiquidityETHWithPermit(
        IERC20 token,
        address pool,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline,
        bool approveMax,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (uint256 amountToken, uint256 amountETH);

    /**
     * @param amountA amount of 1 side token added to the pool
     * @param reserveA current reserve of the pool
     * @param reserveB current reserve of the pool
     * @return amountB amount of the other token added to the pool
     */
    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) external pure returns (uint256 amountB);
}
