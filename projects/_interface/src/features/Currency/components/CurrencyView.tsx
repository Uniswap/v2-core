import { Currency, Token } from "@penta-swap/sdk";
import { CurrencyBalance } from "./CurrencyBalance";
import { CurrencyLogo } from "./CurrencyLogo";

export const CurrencyView: React.VFC<{
  currency: Token | Currency;
  onClick?: (currency: Token | Currency) => void;
}> = ({ currency, onClick }) => {
  return (
    <div
      className="flex-row gap-2 items-center p-2 transition-all active:scale-95 cursor-pointer card hover:bg-base-300"
      onClick={() => onClick && onClick(currency)}
    >
      <CurrencyLogo currency={currency} />
      <div className="grow">
        <div className="text-lg font-bold">{currency.symbol || "Unknown"}</div>
        <div>{currency.name || currency.symbol || "Unknown"}</div>
      </div>
      <CurrencyBalance className="text-lg font-bold" currency={currency} />
    </div>
  );
};
