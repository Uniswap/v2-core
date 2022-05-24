import { chainIdTo } from "@/constants/chains";
import { chainTokens } from "@/constants/tokens";
import { useWeb3 } from "@inaridiy/useful-web3";
import { Currency, Fetcher, Token } from "@penta-swap/sdk";
import { useMemo } from "react";
import { useQueries, useQuery } from "react-query";
import { wrapCurrency } from "../util/wrapCurrency";

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
      queryFn: () => Fetcher.fetchPairData(token1, token2)
    }))
  );
};

export const useRelationPairs = (
  currencyA?: Currency | Token | undefined,
  currencyB?: Currency | Token | undefined
) => {
  const { chainId } = useWeb3();
  const [token1, token2] =
    chainId && currencyA && currencyB
      ? [wrapCurrency(currencyA, chainId), wrapCurrency(currencyB, chainId)]
      : [null, null];

  const tokens: Token[] = useMemo(() => {
    const chainName = chainIdTo(chainId);
    const baseTokens =
      chainName && chainName in tokens
        ? chainTokens[chainName as keyof typeof chainTokens]
        : [];
  }, [currencyA, currencyB]);
};
