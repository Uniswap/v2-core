import { chainParameters } from "@/constants/chains";
import { Currency, Token, WETH } from "@penta-swap/sdk";

export const wrapCurrency = (
  currency: Token | Currency | null
): Token | null => {
  if (currency === null) {
    return null;
  } else if (currency instanceof Token) {
    return currency;
  } else if (currency === Currency.ETHER) {
    return WETH[chainParameters.astar.chainId as 592];
  } else {
    throw new Error("Unauthorized Currency");
  }
};

export const wrapTokens = (
  currencyA: Token | Currency | null,
  currencyB: Token | Currency | null
) =>
  currencyA && currencyB
    ? [wrapCurrency(currencyA), wrapCurrency(currencyB)]
    : [null, null];
