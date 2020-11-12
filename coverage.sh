#!/bin/sh
# because compile with coverage will change the bytecode of uniswap pair so we must replace them
sed -i '.original' -e 's/deb892c32a4aaad45df074ed26362c3ca3f7e2289da80a207ece6cf205604825/49c4aa6629387be085791973c5ba7c8335fbf3b1b5b4adfe5a5a0b1baad5b4a4/g' contracts/libraries/XYZSwapLibrary.sol
yarn buidler coverage
sed -i '.original' -e 's/49c4aa6629387be085791973c5ba7c8335fbf3b1b5b4adfe5a5a0b1baad5b4a4/deb892c32a4aaad45df074ed26362c3ca3f7e2289da80a207ece6cf205604825/g' contracts/libraries/XYZSwapLibrary.sol
