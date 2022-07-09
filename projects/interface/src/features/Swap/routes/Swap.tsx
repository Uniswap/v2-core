import { CurrencyInput } from "@/components/Currency";
import { Currency } from "@penta-swap/sdk";

export const Swap = () => {
  return (
    <div className="flex flex-col gap-4 p-4">
      <CurrencyInput label="Input" currency={Currency.ETHER} />
      <CurrencyInput label="Output" />
    </div>
  );
};
