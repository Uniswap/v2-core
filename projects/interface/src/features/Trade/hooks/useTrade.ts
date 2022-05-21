import {
  Currency,
  JSBI,
  Route,
  Token,
  TokenAmount,
  Trade,
  TradeType
} from "@penta-swap/sdk";
import { useMemo } from "react";
import { wrapCurrency } from "../util/wrapCurrency";

export const useTrade = (
  route: Route | null,
  currency: Token | Currency | null,
  amount: string | number | null
) => {
  return useMemo(() => {
    if (
      route &&
      currency &&
      amount &&
      !JSBI.equal(JSBI.BigInt(0), JSBI.BigInt(amount))
    ) {
      return new Trade(
        route,
        new TokenAmount(wrapCurrency(currency), amount),
        TradeType.EXACT_INPUT
      );
    } else {
      return null;
    }
  }, [route, currency, amount]);
};
