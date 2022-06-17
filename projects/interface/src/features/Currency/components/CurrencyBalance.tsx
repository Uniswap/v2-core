import { useCurrencyBalance } from "@/features/Currency";
import { Currency, Token } from "@penta-swap/sdk";
import { utils } from "ethers";

export const CurrencyBalance: React.VFC<{
  currency: Token | Currency;
  className?: string;
  end?: React.ReactNode;
}> = ({ currency, className, end }) => {
  const { balance, isLoading } = useCurrencyBalance(currency);

  if (balance) {
    return (
      <div className={className}>
        {Number(
          utils.formatUnits(balance, currency.decimals || 18)
        ).toLocaleString()}
        {end}
      </div>
    );
  } else if (isLoading) {
    return <div className={className}>loading...</div>;
  } else {
    return <></>;
  }
};
