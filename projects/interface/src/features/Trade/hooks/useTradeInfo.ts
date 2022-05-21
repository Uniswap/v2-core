import { Currency, Token } from "@penta-swap/sdk";
import { useMemo } from "react";
import { usePair, useRoute, useTrade } from "./";

export const useTradeInfo = (
  currency1: Token | Currency | null,
  currency2: Token | Currency | null,
  amount: string | number | null
) => {
  const { data: pair, ...other } = usePair(currency1, currency2);
  const route = useRoute([pair], currency1);
  const trade = useTrade(route, currency1, amount);
  const price = useMemo(() => trade?.executionPrice || route?.midPrice, [
    trade,
    pair
  ]);
  return { pair, route, trade, price, ...other };
};
