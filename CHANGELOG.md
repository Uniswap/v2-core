### XYZ model: change fee calculation based on reserve and volume.
- Ema volume is implemented at [here](contracts/VolumeTrendRecorder.sol)
- Fee fomula is implemented at [here](contracts/libraries/FeeFomula.sol)
- The architecture with factory, pair and router is the same with uniswap model.

Also change:
- Remove price oracle feature.