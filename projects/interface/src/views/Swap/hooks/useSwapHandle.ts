import { useTradeExactIn } from "@/features/Trade";
import { Currency, Token } from "@penta-swap/sdk";
import { utils } from "ethers";
import { useCallback, useMemo, useState } from "react";

export const useSwapHandle = () => {
  const [currency1, _setCurrency1] = useState<Token | Currency | null>(
    Currency.ETHER
  );
  const [currency2, _setCurrency2] = useState<Token | Currency | null>(null);
  const [inputAmount, setInputAmount] = useState<string | undefined>("");
  const parsedInputAmount = useMemo(
    () =>
      inputAmount &&
      utils
        .parseUnits(String(inputAmount), currency1?.decimals || 18)
        .toString(),
    [inputAmount, currency1]
  );

  const { trade, isLoading } = useTradeExactIn(
    currency1,
    currency2,
    parsedInputAmount || 0
  );
  const outputAmount = useMemo(
    () => (trade ? trade.outputAmount.toSignificant(6) : ""),
    [trade]
  );

  const setCurrency1 = useCallback(
    (newCurrency: Token | Currency | null) => {
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
    (newCurrency: Token | Currency | null) => {
      if (newCurrency === currency1) {
        _setCurrency1(currency2);
        _setCurrency2(newCurrency);
      } else {
        _setCurrency2(newCurrency);
      }
    },
    [currency1, currency2]
  );

  return {
    currencies: { from: currency1, to: currency2 },
    setCurrencies: { from: setCurrency1, to: setCurrency2 },
    amounts: { from: inputAmount, to: outputAmount },
    setInputAmount,
    trade,
    isLoading
  };
};
