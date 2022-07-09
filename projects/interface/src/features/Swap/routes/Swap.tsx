import { CurrencyInput } from "@/components/Currency";
import { Currency } from "@penta-swap/sdk";

export const Swap = () => {
  return (
    <div className="flex flex-col gap-4 px-4">
      <div className="text-2xl font-bold text-center">Swap</div>
      <CurrencyInput label="Input" currency={Currency.ETHER} />
      <CurrencyInput label="Output" />
    </div>
  );
};
