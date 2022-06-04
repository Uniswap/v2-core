import { Trade } from "@penta-swap/sdk";
import { useState } from "react";

export const TradeInfo: React.VFC<{
  trade: Trade | null;
  isLoading: boolean;
}> = ({ trade, isLoading }) => {
  return (
    <div className="flex">
      <TradeRate {...{ trade, isLoading }} />
    </div>
  );
};

export const TradeRate: React.VFC<{
  trade: Trade | null;
  isLoading: boolean;
}> = ({ trade, isLoading }) => {
  const price = trade && trade.executionPrice;
  const [isInvert, setIsInvert] = useState(false);
  const [symbol1, symbol2] = [
    trade?.inputAmount.currency.symbol || "Unknown",
    trade?.outputAmount.currency.symbol || "Unknown"
  ];

  if (isLoading) {
    return <div className="loading btn btn-sm btn-ghost"></div>;
  } else if (!(trade && price)) {
    return <></>;
  } else if (isInvert) {
    return (
      <button
        className="text-lg font-bold btn btn-sm btn-ghost"
        onClick={() => setIsInvert(!isInvert)}
      >{`${price.toSignificant(6)} ${symbol2} = 1 ${symbol1}`}</button>
    );
  } else {
    return (
      <button
        className="text-lg font-bold btn btn-sm btn-ghost"
        onClick={() => setIsInvert(!isInvert)}
      >{`${price.invert().toSignificant(6)} ${symbol1} = 1 ${symbol2}`}</button>
    );
  }
};
