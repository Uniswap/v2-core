import { chainParameters } from "@/constants/chains";
import { Currency, Token, WETH } from "@penta-swap/sdk";

export const wrapCurrency = (
  currency: Token | Currency | null,
  chainId: number
): Token | null => {
  if (currency === null) {
    return null;
  } else if (currency instanceof Token && currency.chainId === chainId) {
    return currency;
  } else if (currency instanceof Token && currency.chainId !== chainId) {
    return null;
  } else if (currency === Currency.ETHER) {
    return WETH[chainParameters.astar.chainId as 592];
  } else {
    throw new Error("Unauthorized Currency");
  }
};
