import { useCurrencyBalance } from "@/features/Currency/hooks/useCurrencyBalance";
import { Currency, Token } from "@penta-swap/sdk";
import { utils } from "ethers";

export const CurrencyBalance: React.VFC<{ currency: Token | Currency }> = ({
  currency,
}) => {
  const { data: balance, isLoading } = useCurrencyBalance(currency);

  if (balance) {
    return (
      <div className="font-bold text-lg">
        {Number(utils.formatUnits(balance, currency.decimals)).toLocaleString()}
      </div>
    );
  } else if (isLoading) {
    return <div className="btn btn-ghost loading"></div>;
  } else {
    return <></>;
  }
};
