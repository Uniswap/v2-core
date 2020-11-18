#!/bin/sh
# because compile with coverage will change the bytecode of uniswap pair so we must replace them
sed -i '.original' -e 's/ef3c5153c31f574e4449543251840d291014435af4be92d9e7e241fdb631fbf5/4ff2b9a62c243f8467a5bc13e0f0a5c1a4c405932f9336b0e2ab99065c6c66c4/g' contracts/libraries/XYZSwapLibrary.sol
yarn buidler coverage
sed -i '.original' -e 's/4ff2b9a62c243f8467a5bc13e0f0a5c1a4c405932f9336b0e2ab99065c6c66c4/ef3c5153c31f574e4449543251840d291014435af4be92d9e7e241fdb631fbf5/g' contracts/libraries/XYZSwapLibrary.sol
