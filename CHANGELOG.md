### XYZ model: change fee calculation based on reserve and volume
- [the white paper](https://github.com/xyzswap/xyz-protocol/blob/main/xyz.pdf)
- Ema volume is implemented at [here](contracts/VolumeTrendRecorder.sol)
- Fee fomula is implemented at [here](contracts/libraries/FeeFomula.sol)
- The architecture with factory, pair and router is the same with uniswap model.

Also change:
- Remove price oracle feature.
### AMP model: allow user to amplify the reserve balance of a pair
- [the white paper](https://github.com/xyzswap/xyz-protocol/blob/main/apr_v2.pdf)
- For each pair, factory contract can create many pools with different amplification factor. 
But there is only pair with amplification factor = 1
- When users swap from A->B->C, they must specify which pools they choose to swap with at router contract.
Router contract will also check if these pools are created from factory contract.