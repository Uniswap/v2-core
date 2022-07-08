import { getCurrencyAddress } from "@/utils/getCurrencyAddress";
import { Currency, Token } from "@penta-swap/sdk";
import { useMemo } from "react";
import { useRecoilValue } from "recoil";
import { CurrencyLogoStates } from "./atoms";
import { nativeLogoSelector } from "./selector";

export const useCurrencyLogo = (currency: Currency | Token) => {
  const address = useMemo(() => getCurrencyAddress(currency), [currency]);
  const logo = useRecoilValue(CurrencyLogoStates(address));
  const nativeLogo = useRecoilValue(nativeLogoSelector);
  return address ? logo : nativeLogo;
};
