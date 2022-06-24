import { Currency, Token } from "@penta-swap/sdk";
import { AiOutlineDown } from "react-icons/ai";
import { CurrencyLogo } from "./CurrencyLogo";

export const CurrencySymbol: React.VFC<{
  currency: Currency | Token | null;
  onClick: () => void;
}> = ({ currency, onClick }) => {
  if (currency) {
    return (
      <button
        className="gap-1 justify-start p-0 text-xl font-bold sm:px-2 btn btn-ghost"
        onClick={onClick}
      >
        <CurrencyLogo currency={currency} className="w-8 h-8" />
        {currency.symbol}

        <AiOutlineDown size="1rem" className="translate-y-[1.25px]" />
      </button>
    );
  } else {
    return (
      <button
        className="justify-start text-xl font-bold sm:px-2 btn btn-ghost"
        onClick={onClick}
      >
        Select Token
      </button>
    );
  }
};
