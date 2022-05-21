import { Currency, Token } from "@penta-swap/sdk";
import { useTradeInfo } from "../hooks";

export const TradeInfo: React.VFC<{
  currency1: Currency | Token | null;
  currency2: Currency | Token | null;
  amount: number | string | null;
}> = ({ currency1, currency2, amount }) => {
  const { trade, price } = useTradeInfo(currency1, currency2, amount);
  if (price && currency1 && currency2) {
    return (
      <div className="justify-start btn btn-ghost">
        <button className="text-lg font-bold">{`${price
          .invert()
          .toSignificant(6)} ${currency1.symbol ||
          "Unknown"} = ${1} ${currency2.symbol || "Unknown"}`}</button>
      </div>
    );
  } else {
    return <div></div>;
  }
};
