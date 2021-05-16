#!/bin/bash
set -euo pipefail

wait-for-proxy()
{
  PROXY_URL="$1"

  for i in {1..40}; do
      if curl -s --header "Content-Type: application/json" --data '{"method":"eth_blockNumber","params":[],"id":93,"jsonrpc":"2.0"}' $PROXY_URL > /dev/null;
      then
        echo `date +%H:%M:%S`" proxy is available"
        return 0
      fi
      echo `date +%H:%M:%S`" proxy is unavailable - sleeping"
      sleep 15
  done

  echo `date +%H:%M:%S`" proxy is unavailable - time is over"
  return 8938
}

while getopts t: option; do
case "${option}" in
    t) IMAGETAG=${OPTARG};;
    *) echo "Usage: $0 [OPTIONS]. Where OPTIONS can be:"
       echo "    -t <IMAGETAG>  tag for cybercoredev/uniswap-v2-core Docker-image"
       exit 1;;
esac
done

export REVISION=latest
docker run --rm --entrypoint cat cybercoredev/proxy:latest proxy/docker-compose-test.yml > node-and-proxy.yml

docker-compose -f node-and-proxy.yml up -d

function cleanup_docker {
    echo "Cleanup docker-compose..."
    docker-compose -f node-and-proxy.yml down
    echo "Cleanup docker-compose done."
}
trap cleanup_docker EXIT
sleep 10

export REVISION=$(git rev-parse HEAD)
UNISWAP_V2_CORE_IMAGE=cybercoredev/uniswap-v2-core:${IMAGETAG:-$REVISION}

export PROXY_URL=http://127.0.0.1:9090/solana

echo "Wait proxy..." && wait-for-proxy "$PROXY_URL"
echo "Run tests..."
docker run --rm -ti --network=host \
     --entrypoint ./deploy-test.sh \
     $UNISWAP_V2_CORE_IMAGE \
     ${EXTRA_ARGS:-"all"}

echo "Run tests return"
exit 0

