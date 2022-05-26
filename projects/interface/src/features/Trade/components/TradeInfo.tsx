import { Currency, Token } from "@penta-swap/sdk";
import { useState } from "react";
import { useTradeExactIn } from "../hooks";

export const TradeInfo: React.VFC<{
  currency1: Currency | Token | null;
  currency2: Currency | Token | null;
  amount: number | string | null;
}> = ({ currency1, currency2, amount }) => {
  const { trade, isLoading } = useTradeExactIn(currency1, currency2, amount);
  const price = trade && trade.executionPrice;
  const [isInvert, setIsInvert] = useState(false);
  if (isLoading && !trade) {
    return <div className="justify-start btn btn-ghost loading"></div>;
  } else if (!(price && currency1 && currency2)) {
    return <></>;
  } else if (price.greaterThan(1) !== isInvert) {
    return (
      <div className="justify-start btn btn-ghost">
        <button
          className="text-lg font-bold"
          onClick={() => setIsInvert(!isInvert)}
        >{`${price.toSignificant(6)} ${currency2.symbol ||
          "Unknown"} = 1 ${currency1.symbol || "Unknown"}`}</button>
      </div>
    );
  } else {
    return (
      <div className="justify-start btn btn-ghost">
        <button
          className="text-lg font-bold"
          onClick={() => setIsInvert(!isInvert)}
        >{`${price.invert().toSignificant(6)} ${currency1.symbol ||
          "Unknown"} = 1 ${currency2.symbol || "Unknown"}`}</button>
      </div>
    );
  }
};
