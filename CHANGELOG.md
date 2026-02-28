### Dynamic fee model: change fee calculation based on reserve and volume
- [The white paper](https://github.com/dynamic-amm/dmm-protocol/blob/main/xyz.pdf)
- Ema volume is implemented at [here](contracts/VolumeTrendRecorder.sol)
- Fee fomula is implemented at [here](contracts/libraries/FeeFomula.sol)
- The architecture with factory, pair (rename to pool) and router is the same with uniswap model.

Also change:
- Remove price oracle feature.
### AMP model: allow user to amplify the reserve balance of a pool
- [The white paper](https://github.com/dynamic-amm/dmm-protocol/blob/main/apr_v2.pdf)
- For each pair, factory contract can create different pools with the same pair of token.   
Because the price range depends on the initial price, we allow users can create different pools with the same amplification factor.   
But there is only 1 pool with amplification factor = 1
- Router:
    - When users swap from A->B->C, users must specify which pools they choose to swap with at router contract.   
Router contract will also check if these pools are created from factory contract.
    - For add/remove liquidity, users must specify which pools they choose to add/remove liquidity.   
To add liquidity to a new pool, users would use function `addLiquidityNewPool` and `addLiquidityNewPoolETH`  
- Change in fee:
  - We divide token pools into 4 categories. In general, the higher amplification used indicate greater price stability, so we use lower base fees.
    - Similar assets pools(amplificationFactor > 20): baseFee = 4 bps
    - Strongly correlated assets pools (20 >= amplificationFactor > 5): baseFee = 10 bps
    - Correlated assets pools (5 >= amplificationFactor > 2): baseFee = 20 bps
    - Uncorrelated assets pools: (amplificationFactor <= 2): baseFee = 30 bps
  - For network fee: we keep to mechanism as uniswap but have `FeeToSetter` to set fees up to 20% grow of the pool (uniswap uses 1/6)