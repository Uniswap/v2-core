import { useModal } from "@/components/Modal";
import { Currency, Token } from "@penta-swap/sdk";
import { CurrencySelect } from "./CureencySelect";
import { CurrencyBalance } from "./CurrencyBalance";
import { CurrencySymbol } from "./CurrencySymbol";

export const CurrencyInput: React.VFC<{
  currency: Token | Currency | null;
  value?: number;
  label: string;
  onSelect?: (currency: Token | Currency) => void;
  onChange?: (value: number) => void;
}> = ({ currency, label, onSelect, value, onChange }) => {
  const { Modal, toggle } = useModal(toggle => (
    <CurrencySelect onSelect={onSelect} onClose={toggle} />
  ));

  return (
    <>
      <Modal />
      <div className="p-3 hover:ring-2 ring-accent card bg-base-200">
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
            type="number"
            placeholder="0.0"
            className="pl-2 w-full text-3xl font-bold bg-transparent outline-none sm:pl-0"
            value={value}
            onChange={e => onChange && onChange(Number(e.target.value))}
          />
        </div>
      </div>
    </>
  );
};
