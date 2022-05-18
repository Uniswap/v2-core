import { Currency, Token } from "@penta-swap/sdk";
import clsx from "clsx";
import NextImage from "next/image";
import { BsQuestionLg } from "react-icons/bs";
import { useCurrencyLogo } from "../hooks/useCurrencyLogo";

export const CurrencyLogo: React.VFC<{
  currency: Currency | Token;
  size?: number;
  className?: string;
}> = ({ currency, size = 100, className }) => {
  const logo = useCurrencyLogo(currency);
  if (logo) {
    return (
      <div className={clsx("aspect-square w-12 h-12", className)}>
        <NextImage
          width={size}
          height={size}
          src={logo}
          alt={`${currency.name || ""} logo`}
        />
      </div>
    );
  } else {
    return (
      <div
        className={clsx("aspect-square w-12 h-12 btn btn-square", className)}
      >
        <BsQuestionLg size="1.8rem" />
      </div>
    );
  }
};
