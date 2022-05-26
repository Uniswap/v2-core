import { useModal } from "@/components/Modal";
import { Currency, Token } from "@penta-swap/sdk";
import { CurrencySelect } from "./CureencySelect";
import { CurrencyBalance } from "./CurrencyBalance";
import { CurrencySymbol } from "./CurrencySymbol";

export const CurrencyInput: React.VFC<{
  currency: Token | Currency | null;
  value?: string;
  label: string;
  onSelect?: (currency: Token | Currency) => void;
  onChange?: (value: string) => void;
}> = ({ currency, label, onSelect, value, onChange }) => {
  const { Modal, toggle } = useModal(toggle => (
    <CurrencySelect onSelect={onSelect} onClose={toggle} />
  ));

  const handleChange = (nextV: string) => {
    if (
      nextV === "" ||
      RegExp(`^\\d*(?:\\\\[.])?\\d*$`).test(
        nextV.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      )
    ) {
      onChange && onChange(nextV);
    }
  };

  return (
    <>
      <Modal />
      <div className="p-3 hover:ring-2 ring-neutral card bg-base-200">
        <div className="flex justify-between items-center">
          <div className="text-lg font-bold">{label}</div>
          {currency && (
            <button className="px-2 font-bold card">
              <CurrencyBalance currency={currency} end={currency.symbol} />
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1 justify-between sm:flex-row sm:items-center">
          <CurrencySymbol currency={currency} onClick={toggle} />
          <div className="-m-1 divider sm:divider-horizontal"></div>
          <input
            type="text"
            inputMode="decimal"
            pattern="^[0-9]*[.,]?[0-9]*$"
            autoComplete="off"
            autoCorrect="off"
            minLength={1}
            maxLength={79}
            spellCheck="false"
            placeholder="0.0"
            className="pl-2 w-full text-3xl font-bold bg-transparent outline-none sm:pl-0"
            value={String(value)}
            onChange={e => handleChange(e.target.value)}
          />
        </div>
      </div>
    </>
  );
};
