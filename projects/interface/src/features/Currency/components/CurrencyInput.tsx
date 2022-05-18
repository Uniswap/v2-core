import { useModal } from "@/components/Modal";
import { Currency, Token } from "@penta-swap/sdk";
import { AiOutlineDown } from "react-icons/ai";
import { CurrencySelect } from "./CureencySelect";
import { CurrencyBalance } from "./CurrencyBalance";
import { CurrencyLogo } from "./CurrencyLogo";

export const CurrencyInput: React.VFC<{
  currency: Token | Currency;
  label: string;
  onSelect?: (currency: Token | Currency) => void;
}> = ({ currency, label, onSelect }) => {
  const { Modal, toggle } = useModal(<CurrencySelect onSelect={onSelect} />);

  return (
    <>
      <Modal />
      <div className="p-3 hover:ring-2 ring-accent card bg-base-200">
        <div className="flex gap-1 justify-between items-center">
          <div className="text-lg font-bold">{label}</div>
          <button className="px-2 font-bold card">
            <CurrencyBalance currency={currency} end={currency.symbol} />
          </button>
        </div>
        <div className="flex gap-1 justify-between items-center">
          <button
            className="gap-1 text-xl font-bold btn btn-ghost"
            onClick={toggle}
          >
            <CurrencyLogo currency={currency} className="w-8 h-8" />
            {currency.symbol}
            <AiOutlineDown size="1rem" />
          </button>
          <div className="mx-0 divider divider-horizontal"></div>
          <input
            type="number"
            placeholder="0.0"
            className="w-full text-3xl font-bold bg-transparent outline-none"
          />
        </div>
      </div>
    </>
  );
};
