import { Currency, Token } from "@penta-swap/sdk";
import { AiOutlineClose } from "react-icons/ai";
import { useCurrencyList } from "../hooks/useCurrencyList";
import { CurrencyView } from "./CurrencyView";

export const CurrencySelect: React.VFC<{
  onSelect?: (currency: Currency | Token) => void;
  onClose?: () => void;
}> = ({ onSelect, onClose }) => {
  const currencyList = useCurrencyList();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Select Token</h3>
        <button className="btn btn-square btn-ghost btn-sm" onClick={onClose}>
          <AiOutlineClose size="1.5rem" />
        </button>
      </div>
      <div className="my-0 divider"></div>
      <input
        type="text"
        placeholder="Search Name or Paste Address"
        className="text-xl font-bold input-bordered input bg-base-200"
      />
      <div className="flex flex-col">
        {currencyList.map((currency, i) => (
          <CurrencyView
            currency={currency}
            onClick={onSelect}
            key={`${i}-${
              currency instanceof Token ? currency.address : currency.name || ""
            }`}
          />
        ))}
      </div>
    </div>
  );
};
