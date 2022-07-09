import { useCurrencyLogo } from "@/states/currency";
import { QuestionMarkCircleIcon } from "@heroicons/react/outline";
import { Currency } from "@penta-swap/sdk";
import { memo } from "react";

// eslint-disable-next-line react/display-name
export const CurrencyLogo: React.FC<{ currency: Currency }> = memo(
  ({ currency }) => {
    const logoUrl = useCurrencyLogo(currency);
    if (logoUrl) {
      return (
        <img
          src={logoUrl}
          alt={currency.name}
          className="aspect-square w-10 rounded-lg"
        />
      );
    } else {
      return (
        <QuestionMarkCircleIcon className="aspect-square w-12 rounded-lg" />
      );
    }
  }
);
