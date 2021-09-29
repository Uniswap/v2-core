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

docker pull neonlabsorg/uniswap-v2-core:${REVISION}
docker tag neonlabsorg/uniswap-v2-core:${REVISION} neonlabsorg/uniswap-v2-core:${TAG}
docker push neonlabsorg/uniswap-v2-core:${TAG}
