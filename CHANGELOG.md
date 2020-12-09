### XYZ model: change fee calculation based on reserve and volume.
- Ema volume is implemented at [here](contracts/VolumeTrendRecorder.sol)
- Fee fomula is implemented at [here](contracts/libraries/FeeFomula.sol)
- The architecture with factory, pair and router is the same with uniswap model.

Also change:
- Using ETH instead of weth (see at [here](https://github.com/xyzswap/smart-contracts/pull/3/files))

This would help us to simplify the API and reduce gas cost.
For example: **addLiquidityETH** can change to **addLiquidity** with ETH_ADDRESS(0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee) 
- Remove price oracle feature.