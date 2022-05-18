import { useCurrencyBalance } from "@/features/Currency/hooks/useCurrencyBalance";
import { Currency, Token } from "@penta-swap/sdk";
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
    return <div className="btn btn-ghost loading"></div>;
  } else {
    return <></>;
  }
};
