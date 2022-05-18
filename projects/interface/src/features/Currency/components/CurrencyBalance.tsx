import { useCurrencyBalance } from "@/features/Currency/hooks/useCurrencyBalance";
import { Currency, Token } from "@penta-swap/sdk";
import clsx from "clsx";
import { utils } from "ethers";

export const CurrencyBalance: React.VFC<{
  currency: Token | Currency;
  className?: string;
  end?: React.ReactNode;
}> = ({ currency, className, end }) => {
  const { data: balance, isLoading } = useCurrencyBalance(currency);

  if (balance) {
    return (
      <div className={className}>
        {Number(utils.formatUnits(balance, currency.decimals)).toLocaleString()}
        {end}
      </div>
    );
  } else if (isLoading) {
    return (
      <div
        className={clsx("btn btn-ghost loading", className && "btn-sm")}
      ></div>
    );
  } else {
    return <></>;
  }
};
