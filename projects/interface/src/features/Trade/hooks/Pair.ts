import { chainTokens } from "@/constants/tokens";
import { useCurrentChain } from "@/hooks";
import { Fetcher, Pair, Token } from "@penta-swap/sdk";
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
  const { perm } = useCurrentChain();
  const pairQueries = useQueries(
    tokenPairs.map(([token1, token2]) => ({
      queryKey: ["pair", token1.chainId, token1.address, token2.address],
      queryFn: () =>
        Fetcher.fetchPairData(
          token1,
          token2,
          new ethers.providers.JsonRpcProvider(perm.rpcUrls[0])
        ),

      retry: false
    }))
  );
  const pairs = useMemo(
    () =>
      pairQueries
        .map(({ data }) => data)
        .filter((pair): pair is Pair => Boolean(pair)),
    [pairQueries]
  );
  const { isLoading, isError } = useMemo(
    () =>
      pairQueries.reduce(
        (a, b) => ({
          isLoading: a.isLoading || b.isLoading,
          isError: a.isError || b.isError
        }),
        { isLoading: false, isError: false }
      ),
    [pairQueries]
  );

  return { isLoading, isError, pairs };
};

export const useRelationPairs = (
  token1?: Token | null,
  token2?: Token | null
) => {
  const { name } = useCurrentChain();

  const commonTokens: Token[] = useMemo(() => {
    return name && name in chainTokens
      ? chainTokens[name as keyof typeof chainTokens]
      : [];
  }, [name, token1, token2]);

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
    [token1, token2, commonTokens, basePairs]
  );

  const allPairs = usePairs(allRelationTokenPairs);
  return allPairs;
};
