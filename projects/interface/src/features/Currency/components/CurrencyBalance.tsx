import { chainParameters } from "@/constants/chains";
import {
  useNativeCurrencyBalance,
  useTokenBalance
} from "@/features/Currency/hooks/useCurrencyBalance";
import { Currency, Token } from "@penta-swap/sdk";
import clsx from "clsx";
import { utils } from "ethers";

export const TokenBalance: React.VFC<{
  token: Token;
  className?: string;
  end?: React.ReactNode;
}> = ({ token, className, end }) => {
  const { data: balance, isLoading } = useTokenBalance(token);

  if (balance) {
    return (
      <div className={className}>
        {Number(utils.formatUnits(balance, token.decimals)).toLocaleString()}
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

export const NativeCurrencyBalance: React.VFC<{
  className?: string;
  end?: React.ReactNode;
}> = ({ className, end }) => {
  const { data: balance, isLoading } = useNativeCurrencyBalance(
    chainParameters.astar.chainId
  );

  if (balance) {
    return (
      <div className={className}>
        {Number(utils.formatUnits(balance, 18)).toLocaleString()}
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

export const CurrencyBalance: React.VFC<{
  currency: Token | Currency;
  className?: string;
  end?: React.ReactNode;
}> = ({ currency, ...props }) => {
  if (currency instanceof Token) {
    return <TokenBalance {...{ token: currency, ...props }} />;
  } else if (currency === Currency.ETHER) {
    return <NativeCurrencyBalance {...props} />;
  } else {
    return <></>;
  }
};
