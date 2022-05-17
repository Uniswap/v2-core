import { Token } from "@penta-swap/sdk";

export const CurrencyView: React.VFC<{ currency: Token }> = ({ currency }) => {
  return (
    <div className="p-2 transition-all card hover:bg-base-300">
      <div>
        <div className="text-lg font-bold">{currency.symbol || "Unknown"}</div>
        <div>{currency.name || currency.symbol || "Unknown"}</div>
      </div>
    </div>
  );
};
