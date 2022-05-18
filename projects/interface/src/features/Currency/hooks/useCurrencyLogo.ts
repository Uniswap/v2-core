import { logos, nativeLogos } from "@/constants/logos";
import { Currency, Token } from "@penta-swap/sdk";
import { useMemo } from "react";

export const useCurrencyLogo = (currency: Currency | Token) => {
  if (currency == Currency.ETHER) {
    return nativeLogos.astar;
  } else {
    return useMemo(
      () =>
        "address" in currency && currency.address in logos
          ? logos[currency.address as keyof typeof logos]
          : undefined,
      [currency]
    );
  }
};
