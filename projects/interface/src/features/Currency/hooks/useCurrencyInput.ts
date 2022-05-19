import { Currency, Token } from "@penta-swap/sdk";
import { useCallback, useState } from "react";

export const useCurrencyInput = () => {
  const [currency1, _setCurrency1] = useState<Token | Currency | null>(
    Currency.ETHER
  );
  const [currency2, _setCurrency2] = useState<Token | Currency | null>(null);

  const setCurrency1 = useCallback(
    (newCurrency: Token | Currency) => {
      if (newCurrency === currency2) {
        _setCurrency2(currency1);
        _setCurrency1(newCurrency);
      } else {
        _setCurrency1(newCurrency);
      }
    },
    [currency1, currency2]
  );
  const setCurrency2 = useCallback(
    (newCurrency: Token | Currency) => {
      if (newCurrency === currency1) {
        _setCurrency1(currency2);
        _setCurrency2(newCurrency);
      } else {
        _setCurrency2(newCurrency);
      }
    },
    [currency1, currency2]
  );

  return { currency1, currency2, setCurrency1, setCurrency2 };
};
