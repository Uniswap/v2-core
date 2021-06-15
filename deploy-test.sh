#!/bin/bash
set -euo pipefail

echo "\$1="$1

if [ "$1" = "all" ]; then
  yarn test
else
  node node_modules/mocha/bin/mocha --grep "^UniswapV2Pair swap:token0$"
fi

exit 0
