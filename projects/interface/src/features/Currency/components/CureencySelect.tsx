import { Currency, Token } from "@penta-swap/sdk";
import { memo, useMemo, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { useCurrencyList } from "../hooks/useCurrencyList";
import { CurrencyView } from "./CurrencyView";

export const CurrencySelect: React.VFC<{
  onSelect?: (currency: Currency | Token) => void;
  onClose?: () => void;
}> = memo(function CurrencySelect({ onSelect, onClose }) {
  const currencyList = useCurrencyList();
  const [input, setInput] = useState("");
  const sortedCurrencyList = useMemo(() => {
    return currencyList.filter(
      currency =>
        currency.name?.toLocaleLowerCase().includes(input.toLowerCase()) ||
        currency.symbol?.toLocaleLowerCase().includes(input.toLowerCase())
    );
  }, [input, currencyList]);
  return (
    <div className="flex relative flex-col gap-2">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Select Token</h3>
        <button className="btn btn-square btn-ghost btn-sm" onClick={onClose}>
          <AiOutlineClose size="1.5rem" />
        </button>
      </div>
      <div className="my-0 divider"></div>
      <input
        type="text"
        placeholder="Search Name"
        className="w-full text-xl font-bold input-bordered input bg-base-200"
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      <div className="flex static flex-col">
        {sortedCurrencyList.map((currency, i) => (
          <CurrencyView
            currency={currency}
            onClick={currency => {
              onSelect && onSelect(currency);
              onClose && onClose();
            }}
            key={`${i}-${
              currency instanceof Token ? currency.address : currency.name || ""
            }`}
          />
        ))}
      </div>
    </div>
  );
});
