import { useModal } from "@/components/Modal";
import { Currency, Token } from "@penta-swap/sdk";
import { AiOutlineDown } from "react-icons/ai";
import { CurrencySelect } from "./CureencySelect";
import { CurrencyBalance } from "./CurrencyBalance";
import { CurrencyLogo } from "./CurrencyLogo";

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
        <div className="flex gap-1 justify-between items-center">
          <div className="text-lg font-bold">{label}</div>
          {currency && (
            <button className="px-2 font-bold card">
              <CurrencyBalance currency={currency} end={currency.symbol} />
            </button>
          )}
        </div>
        <div className="flex gap-1 justify-between items-center">
          {currency ? (
            <button
              className="gap-1 justify-start p-0 text-xl font-bold sm:px-2 btn btn-ghost"
              onClick={toggle}
            >
              <CurrencyLogo currency={currency} className="w-8 h-8" />
              {currency.symbol}
              <AiOutlineDown size="1rem" />
            </button>
          ) : (
            <button
              className="p-0 font-bold sm:px-2 btn btn-ghost"
              onClick={toggle}
            >
              Select Token
            </button>
          )}
          <div className="mx-0 divider divider-horizontal"></div>
          <input
            type="number"
            placeholder="0.0"
            className="w-full text-3xl font-bold bg-transparent outline-none"
            value={value}
            onChange={e => onChange && onChange(Number(e.target.value))}
          />
        </div>
      </div>
    </>
  );
};
