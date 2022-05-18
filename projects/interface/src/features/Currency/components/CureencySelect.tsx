import { useCurrencyList } from "../hooks/useCurrencyList";
import { CurrencyView } from "./CurrencyView";

export const CurrencySelect = () => {
  const currencyList = useCurrencyList();
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xl font-bold">Select Token</h3>
      <div className="my-0 divider"></div>
      <input
        type="text"
        placeholder="Search Name or Paste Address"
        className="text-xl font-bold input-bordered input bg-base-200"
      />
      <div className="flex flex-col">
        {currencyList.map((currency, i) => (
          <CurrencyView currency={currency} key={`${i}-${currency.name}`} />
        ))}
      </div>
    </div>
  );
};
