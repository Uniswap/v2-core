#!/bin/bash
set -euo pipefail

TESTSET=${1:-}
echo "\$TESTSET='$TESTSET'"

if [ "$TESTSET" = "all" ]; then
  yarn test
else
  node node_modules/mocha/bin/mocha --grep "^UniswapV2Pair swap:token0$"
fi

exit 0
