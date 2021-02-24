### XYZ model: change fee calculation based on reserve and volume
- [The white paper](https://github.com/xyzswap/xyz-protocol/blob/main/xyz.pdf)
- Ema volume is implemented at [here](contracts/VolumeTrendRecorder.sol)
- Fee fomula is implemented at [here](contracts/libraries/FeeFomula.sol)
- The architecture with factory, pair and router is the same with uniswap model.

Also change:
- Remove price oracle feature.
### AMP model: allow user to amplify the reserve balance of a pair
- [The white paper](https://github.com/xyzswap/xyz-protocol/blob/main/apr_v2.pdf)
- For each pair, factory contract can create different pools with the same pair of token.   
Because the price range depends on the initial price, we allow users can create different pools with the same amplification factor.   
But there is only pair with amplification factor = 1
- Router:
    - When users swap from A->B->C, users must specify which pools they choose to swap with at router contract.   
Router contract will also check if these pools are created from factory contract.
    - For add/remove liquidity, users must specify which pools they choose to add/remove liquidity.   
To add liquidity to a new pool, users would use function `addLiquidityNewPool` and `addLiquidityNewPoolETH`  
- Change in fee:
  - We divide pair into 4 categories, the higher amplification will inidicate that the more stable price, so we use lower base fee
    - Similar asserts pairs(amplifacationFactor > 20): baseFee = 4 bps
    - Strongly correlated assets pairs (20 >= amplicationFactor > 5): baseFee = 10 bps
    - Correlated assets pairs (5 >= amplificationFactor > 2): baseFee = 20 bps
    - Uncorrelated assets pairs: (amplifactionFactor <= 2): baseFee = 30 bps
  - For network fee: we keep to mechanism from uniswap but let `FeeToSetter` can set fee from network from up to 20% grow of the pool (this number of uniswap is 1/6)