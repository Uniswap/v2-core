import { Token } from "@penta-swap/sdk";
import { CurrencyBalance } from "./CurrencyBalance";

export const CurrencyView: React.VFC<{ currency: Token }> = ({ currency }) => {
  return (
    <div className="p-2 transition-all card hover:bg-base-300 flex-row items-center">
      <div className="grow">
        <div className="text-lg font-bold">{currency.symbol || "Unknown"}</div>
        <div>{currency.name || currency.symbol || "Unknown"}</div>
      </div>
      <CurrencyBalance currency={currency} />
    </div>
  );
};
