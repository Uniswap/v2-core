import { NumberInput } from "@/components/Elements";
import { Currency } from "@penta-swap/sdk";
import { memo } from "react";
import { CurrencyLogo } from "./CurrencyLogo";

// eslint-disable-next-line react/display-name
export const CurrencyInput = memo(() => {
  return (
    <div className="p-3 hover:ring-2 ring-neutral card bg-base-200">
      <div className="flex flex-col gap-1 justify-between sm:flex-row sm:items-center">
        <CurrencyLogo currency={Currency.ETHER} />
        <div className="-m-1 divider sm:divider-horizontal"></div>
        <NumberInput className="pl-2 w-full text-3xl font-bold bg-transparent outline-none sm:pl-0 input" />
      </div>
    </div>
  );
});
