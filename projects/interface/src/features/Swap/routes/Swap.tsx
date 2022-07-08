import { CurrencyInput } from "@/components/Currency";

export const Swap = () => {
  return (
    <div className="flex flex-col gap-4">
      <CurrencyInput />
      <CurrencyInput />
    </div>
  );
};
