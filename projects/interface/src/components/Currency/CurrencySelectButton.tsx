import { ChevronDownIcon } from "@heroicons/react/outline";
import { Currency, Token } from "@penta-swap/sdk";
import clsx from "clsx";
import { CurrencyLogo } from "./CurrencyLogo";

export const CurrencySelectButton: React.FC<
  JSX.IntrinsicElements["button"] & {
    currency: Token | Currency | null;
  }
> = ({ currency, className, ...props }) => {
  if (currency) {
    return (
      <button
        className={clsx(
          "gap-1 justify-start p-0 text-xl font-bold sm:px-2 btn btn-ghost",
          className
        )}
        {...props}
      >
        <CurrencyLogo currency={currency} />
        {currency.symbol}
        <ChevronDownIcon className="w-6 h-6" />
      </button>
    );
  } else {
    return (
      <button
        className={clsx(
          "justify-start text-xl font-bold sm:px-2 btn btn-ghost",
          className
        )}
        {...props}
      >
        Select Token
      </button>
    );
  }
};
