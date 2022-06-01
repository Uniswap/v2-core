import { Trade } from "@penta-swap/sdk";
import { useState } from "react";

export const TradeInfo: React.VFC<{
  trade: Trade | null;
  isLoading: boolean;
}> = ({ trade, isLoading }) => {
  const price = trade && trade.executionPrice;
  console.log(price);
  const [isInvert, setIsInvert] = useState(false);
  const [symbol1, symbol2] = [
    trade?.inputAmount.currency.symbol || "Unknown",
    trade?.outputAmount.currency.symbol || "Unknown"
  ];

  if (isLoading && !trade) {
    return <div className="btn btn-ghost loading"></div>;
  } else if (!(trade && price)) {
    return <></>;
  } else if (isInvert) {
    return (
      <div className="justify-start btn btn-ghost">
        <button
          className="text-lg font-bold"
          onClick={() => setIsInvert(!isInvert)}
        >{`${price.toSignificant(6)} ${symbol2} = 1 ${symbol1}`}</button>
      </div>
    );
  } else {
    return (
      <div className="justify-start btn btn-ghost">
        <button
          className="text-lg font-bold"
          onClick={() => setIsInvert(!isInvert)}
        >{`${price
          .invert()
          .toSignificant(6)} ${symbol1} = 1 ${symbol2}`}</button>
      </div>
    );
  }
};
