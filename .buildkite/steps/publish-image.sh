#!/bin/bash
set -euo pipefail

REVISION=$(git rev-parse HEAD)

docker images

docker login -u $DHUBU -p $DHUBP

if [[ ${BUILDKITE_BRANCH} == "master" ]]; then
    TAG=stable
elif [[ ${BUILDKITE_BRANCH} == "develop" ]]; then
    TAG=latest
else
    TAG=${BUILDKITE_BRANCH}
fi

docker pull cybercoredev/uniswap-v2-core:${REVISION}
docker tag cybercoredev/uniswap-v2-core:${REVISION} cybercoredev/uniswap-v2-core:${TAG}
docker push cybercoredev/uniswap-v2-core:${TAG}
