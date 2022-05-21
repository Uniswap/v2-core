import { Currency, Pair, Route, Token } from "@penta-swap/sdk";
import { useMemo } from "react";
import { wrapCurrency } from "../util/wrapCurrency";

export const useRoute = (
  pairs: (Pair | undefined)[],
  currency: Token | Currency | null
) => {
  return useMemo(() => {
    const truePairs = pairs.filter(pair => Boolean(pair)) as Pair[];
    return currency && truePairs.length >= 1
      ? new Route(truePairs, wrapCurrency(currency))
      : null;
  }, [pairs, currency]);
};
