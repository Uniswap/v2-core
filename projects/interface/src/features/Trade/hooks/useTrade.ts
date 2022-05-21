import {
  Currency,
  Route,
  Token,
  TokenAmount,
  Trade,
  TradeType
} from "@penta-swap/sdk";
import { BigNumber, BigNumberish } from "ethers";
import { useMemo } from "react";
import { wrapCurrency } from "../util/wrapCurrency";

export const useTrade = (
  route: Route | null,
  currency: Token | Currency | null,
  amount: BigNumberish | null
) => {
  return useMemo(() => {
    if (route && currency && amount) {
      return new Trade(
        route,
        new TokenAmount(
          wrapCurrency(currency),
          BigNumber.from(amount).toString()
        ),
        TradeType.EXACT_INPUT
      );
    } else {
      return null;
    }
  }, [route, currency, amount]);
};
