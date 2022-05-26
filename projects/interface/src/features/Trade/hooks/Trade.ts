import { useWeb3 } from "@inaridiy/useful-web3";
import { Currency, Pair, Token, TokenAmount, Trade } from "@penta-swap/sdk";
import { useMemo } from "react";
import { wrapCurrency } from "../util/wrapCurrency";
import { useRelationPairs } from "./Pair";

export const useTradeExactIn = (
  currencyA: Currency | Token | null,
  currencyB: Currency | Token | null,
  amount: string | number | null
) => {
  const { chainId } = useWeb3();
  const [token1, token2] =
    chainId && currencyA && currencyB
      ? [wrapCurrency(currencyA, chainId), wrapCurrency(currencyB, chainId)]
      : [null, null];
  const relationPairQueries = useRelationPairs(token1, token2);

  const relationPairs = useMemo(
    () =>
      relationPairQueries
        .map(({ data }) => data)
        .filter((pair): pair is Pair => Boolean(pair)),
    [relationPairQueries]
  );
  const { isLoading, isError } = useMemo(
    () =>
      relationPairQueries.reduce(
        (a, b) => ({
          isLoading: a.isLoading || b.isLoading,
          isError: a.isError || b.isError
        }),
        { isLoading: false, isError: false }
      ),
    [relationPairQueries]
  );

  const trade = useMemo(() => {
    if (relationPairs.length > 0 && amount && token1 && token2) {
      return (
        Trade.bestTradeExactIn(
          relationPairs,
          new TokenAmount(token1, amount),
          token2,
          { maxHops: 1, maxNumResults: 1 }
        )[0] || null
      );
    } else {
      return null;
    }
  }, [relationPairs, token1, token2, amount]);
  return { isLoading, isError, trade };
};
