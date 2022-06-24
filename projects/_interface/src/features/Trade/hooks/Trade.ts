import { Currency, JSBI, Token, TokenAmount, Trade } from "@penta-swap/sdk";
import { useMemo } from "react";
import { wrapTokens } from "./../util/wrapCurrency";
import { useRelationPairs } from "./Pair";

export const useTradeExactOut = (
  currencyA: Currency | Token | null,
  currencyB: Currency | Token | null,
  amount: string | number | JSBI | null,
  maxHops = 2
) => {
  const [token1, token2] = wrapTokens(currencyA, currencyB);
  const { isError, isLoading, pairs: relationPairs } = useRelationPairs(
    token1,
    token2
  );

  const trade = useMemo(() => {
    if (relationPairs.length > 0 && amount && token1 && token2) {
      return (
        Trade.bestTradeExactOut(
          relationPairs,
          token1,
          new TokenAmount(token2, amount),
          { maxHops, maxNumResults: 1 }
        )[0] || null
      );
    } else {
      return null;
    }
  }, [relationPairs, token1, token2, amount]);
  return { isLoading, isError, trade };
};

export const useTradeExactIn = (
  currencyA: Currency | Token | null,
  currencyB: Currency | Token | null,
  amount: string | number | JSBI | null,
  maxHops = 2
) => {
  const [token1, token2] = wrapTokens(currencyA, currencyB);
  const { isError, isLoading, pairs: relationPairs } = useRelationPairs(
    token1,
    token2
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
