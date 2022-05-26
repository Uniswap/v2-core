import {
  Currency,
  JSBI,
  Pair,
  Token,
  TokenAmount,
  Trade
} from "@penta-swap/sdk";
import { useMemo } from "react";
import { wrapCurrency } from "../util/wrapCurrency";
import { useRelationPairs } from "./Pair";

export const useTradeExactIn = (
  currencyA: Currency | Token | null,
  currencyB: Currency | Token | null,
  amount: string | number | JSBI | null,
  maxHops = 1
) => {
  const [token1, token2] =
    currencyA && currencyB
      ? [wrapCurrency(currencyA), wrapCurrency(currencyB)]
      : [null, null];
  const relationPairQueries = useRelationPairs(token1, token2);

  const relationPairs = useMemo(
    () =>
      relationPairQueries
        .map(({ data }) => data)
        .filter((pair): pair is Pair => Boolean(pair)),
    [relationPairQueries]
  );
  console.log(relationPairs.length);
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
          { maxHops, maxNumResults: 1 }
        )[0] || null
      );
    } else {
      return null;
    }
  }, [relationPairs, token1, token2, amount]);
  return { isLoading, isError, trade };
};
