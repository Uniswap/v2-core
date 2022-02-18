#!/bin/bash
set -xeo pipefail

TESTSET=${1:-}
echo "\$TESTSET='$TESTSET'"

if [[ -z "$FAUCET_URL" ]]; then
    echo 'FAUCET_URL is not set'
    exit 1
else
    curl -i -X POST -H "Content-Type: text/plain" "$FAUCET_URL/request_neon" -d '{ "wallet": "0xaA4d6f4FF831181A2bBfD4d62260DabDeA964fF1", "amount": 100 }'
    curl -i -X POST -H "Content-Type: text/plain" "$FAUCET_URL/request_neon" -d '{ "wallet": "0x6970d087e7e78A13Ea562296edb05f4BB64D5c2E", "amount": 100 }'
fi

if [ "$TESTSET" = "all" ]; then
    yarn test
else
    node node_modules/mocha/bin/mocha --grep "^UniswapV2Pair swap:token0$"
fi

exit 0
