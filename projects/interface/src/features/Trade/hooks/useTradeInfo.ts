import { Currency, Token } from "@penta-swap/sdk";
import { BigNumberish } from "ethers";
import { usePair, useRoute, useTrade } from "./";

export const useTradeInfo = (
  currency1: Token | Currency | null,
  currency2: Token | Currency | null,
  amount: BigNumberish | null
) => {
  const { data: pair, ...other } = usePair(currency1, currency2);
  const route = useRoute([pair], currency1);
  const trade = useTrade(route, currency1, amount);
  return { pair, route, trade, ...other };
};
