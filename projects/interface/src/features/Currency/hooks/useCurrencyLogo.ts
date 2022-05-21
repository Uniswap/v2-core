import { logos, nativeLogos } from "@/constants/logos";
import { Currency, Token } from "@penta-swap/sdk";
import { useMemo } from "react";

export const useCurrencyLogo = (currency: Currency | Token | null) => {
  return useMemo(() => {
    if (currency == Currency.ETHER) {
      return nativeLogos.astar;
    } else if (currency && "address" in currency && currency.address in logos) {
      return logos[currency.address as keyof typeof logos];
    } else {
      return undefined;
    }
  }, [currency]);
};
