import { chainParameters } from "@/constants/chains";
import { Currency, Token, WETH } from "@penta-swap/sdk";

type wrapType<T> = T extends Currency ? Token : null;

export const wrapCurrency = <T extends Token | Currency | null>(
  currency: T
): wrapType<T> => {
  if (currency === null) {
    return null as wrapType<T>;
  } else if (currency instanceof Token) {
    return currency as wrapType<T>;
  } else if (currency === Currency.ETHER) {
    return WETH[chainParameters.astar.chainId as 592] as wrapType<T>;
  } else {
    throw new Error("Unauthorized Currency");
  }
};
