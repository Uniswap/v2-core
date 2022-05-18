import { useModal } from "@/components/Modal";
import { Currency, Token } from "@penta-swap/sdk";
import { AiOutlineDown } from "react-icons/ai";
import { CurrencySelect } from "./CureencySelect";
import { CurrencyBalance } from "./CurrencyBalance";

export const CurrencyInput: React.VFC<{
  currency: Token | Currency;
  onSelect?: (currency: Token | Currency) => void;
}> = ({ currency, onSelect }) => {
  const { Modal, toggle } = useModal(<CurrencySelect onSelect={onSelect} />);

  return (
    <>
      <Modal />
      <div className="p-3 hover:ring-2 ring-accent card bg-base-200">
        <div className="flex gap-2 justify-between items-center">
          <input
            type="number"
            placeholder="0.0"
            className="w-full text-3xl font-bold bg-transparent outline-none"
          />

          <button className="gap-2 text-xl font-bold btn" onClick={toggle}>
            {currency.symbol}
            <AiOutlineDown size="1rem" />
          </button>
        </div>
        <div className="flex gap-1 justify-end items-center">
          <button className="btn btn-sm btn-ghost">MAX</button>
          <CurrencyBalance
            className="badge badge-outline font-bold"
            currency={currency}
            end={currency.symbol}
          />
        </div>
      </div>
    </>
  );
};
