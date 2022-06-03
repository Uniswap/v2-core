import { parseCurrency, useTradeExactIn } from "@/features/Trade";
import { Currency, Token } from "@penta-swap/sdk";
import { useCallback, useState } from "react";
import { useTradeExactOut } from "./../../../features/Trade/hooks/Trade";

export const useSwapHandle = () => {
  const [currency1, _setCurrency1] = useState<Token | Currency | null>(
    Currency.ETHER
  );
  const [currency2, _setCurrency2] = useState<Token | Currency | null>(null);
  const [_inputAmount, _setInputAmount] = useState("");
  const [_outputAmount, _setOutputAmount] = useState("");
  const [editing, setEditing] = useState<"input" | "output">("input");

  const setInputAmount = useCallback((amount: string) => {
    _setInputAmount(amount);
    setEditing("input");
  }, []);
  const setOutputAmount = (amount: string) => {
    if (Number(amount) !== 0 && !isNaN(Number(amount))) {
      _setOutputAmount(amount);
      setEditing("output");
    } else {
      _setInputAmount("");
      setEditing("input");
    }
  };
  const { trade: inTrade, isLoading: isInTradeLoading } = useTradeExactIn(
    editing === "input" ? currency1 : null,
    currency2,
    parseCurrency(currency1, _inputAmount)
  );
  const { trade: outTrade, isLoading: isOutTradeLoading } = useTradeExactOut(
    editing === "output" ? currency1 : null,
    currency2,
    parseCurrency(currency2, _outputAmount)
  );

  const [amount1 = "", amount2 = ""] =
    editing === "input"
      ? [_inputAmount, inTrade?.outputAmount.toSignificant()]
      : [outTrade?.inputAmount.toSignificant(), _outputAmount];

  const [disabled1, disabled2] =
    editing === "input"
      ? [false, isInTradeLoading]
      : [isOutTradeLoading, false];

  const switchCurrency = () => {
    _setCurrency1(currency2);
    _setCurrency2(currency1);
    setOutputAmount(amount1);
  };

  const setCurrency1 = (newCurrency: Token | Currency | null) => {
    if (newCurrency === currency2) {
      switchCurrency();
    } else {
      _setCurrency1(newCurrency);
    }
  };

  const setCurrency2 = (newCurrency: Token | Currency | null) => {
    if (newCurrency === currency1) {
      switchCurrency();
    } else {
      _setCurrency2(newCurrency);
    }
  };

  return {
    currencies: { from: currency1, to: currency2 },
    setAmount: { from: setInputAmount, to: setOutputAmount },
    setCurrencies: { from: setCurrency1, to: setCurrency2 },
    amounts: { from: amount1, to: amount2 },
    disabled: { from: disabled1, to: disabled2 },
    trade: editing === "input" ? inTrade : outTrade,
    switchCurrency,
    isLoading: editing === "input" ? isInTradeLoading : isOutTradeLoading
  };
};
