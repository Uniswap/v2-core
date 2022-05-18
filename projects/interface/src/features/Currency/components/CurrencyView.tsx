import { Currency, Token } from "@penta-swap/sdk";
import { CurrencyBalance } from "./CurrencyBalance";
import { CurrencyLogo } from "./CurrencyLogo";

export const CurrencyView: React.VFC<{
  currency: Token | Currency;
  onClick?: (currency: Token | Currency) => void;
}> = ({ currency, onClick }) => {
  return (
    <div
      className="p-2 transition-all card hover:bg-base-300 flex-row items-center gap-2 active:scale-95"
      onClick={() => onClick && onClick(currency)}
    >
      <CurrencyLogo currency={currency} />
      <div className="grow">
        <div className="text-lg font-bold">{currency.symbol || "Unknown"}</div>
        <div>{currency.name || currency.symbol || "Unknown"}</div>
      </div>
      <CurrencyBalance currency={currency} />
    </div>
  );
};
