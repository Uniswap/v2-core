import { chainIdTo } from "@/constants/chains";
import { chainTokens } from "@/constants/tokens";
import { useWeb3 } from "@inaridiy/useful-web3";
import { Fetcher, Token } from "@penta-swap/sdk";
import { ethers } from "ethers";
import { useMemo } from "react";
import { useQueries, useQuery } from "react-query";

export const usePair = ([token1, token2]: [Token, Token] | [null, null]) => {
  return useQuery(
    ["pair", token1?.chainId, token2?.address, token2?.address],
    () => Fetcher.fetchPairData(token1 as Token, token2 as Token),
    { enabled: Boolean(token1 && token2) }
  );
};

export const usePairs = (tokenPairs: [Token, Token][]) => {
  return useQueries(
    tokenPairs.map(([token1, token2]) => ({
      queryKey: ["pair", token1.chainId, token1.address, token2.address],
      queryFn: () =>
        Fetcher.fetchPairData(
          token1,
          token2,
          new ethers.providers.JsonRpcProvider(
            "https://astar.blastapi.io/6a492343-ce82-409d-89fe-38838ab38fdd"
          )
        ),
      retry: 0
    }))
  );
};

export const useRelationPairs = (
  token1?: Token | null,
  token2?: Token | null
) => {
  const { chainId } = useWeb3();

  const commonTokens: Token[] = useMemo(() => {
    const chainName = chainIdTo(chainId);
    return chainName && chainName in chainTokens
      ? chainTokens[chainName as keyof typeof chainTokens]
      : [];
  }, [chainId, token1, token2]);

  const basePairs = useMemo(
    () =>
      commonTokens
        .map(base =>
          commonTokens
            .filter(other => other !== base)
            .map(other => [base, other])
        )
        .flat(1) as [Token, Token][],
    [commonTokens]
  );
  const allRelationTokenPairs = useMemo(
    () =>
      token1 && token2
        ? [
            [token1, token2],
            ...commonTokens.map(common => [token1, common]),
            ...commonTokens.map(common => [token2, common]),
            ...basePairs
          ]
            .filter((tokens): tokens is [Token, Token] =>
              Boolean(tokens[0] && tokens[1])
            )
            .filter(tokens => tokens[0].address !== tokens[1].address)
        : [],
    [token1, token2, commonTokens, basePairs, chainId]
  );

  const allPairs = usePairs(allRelationTokenPairs);
  return allPairs;
};
