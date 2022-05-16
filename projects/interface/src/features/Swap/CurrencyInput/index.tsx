import { useModal } from "@/components/Modal";
import { AiOutlineDown } from "react-icons/ai";
import { CurrencySelect } from "../CureencySelect";

export const CurrencyInput: React.VFC<
  { symbol: string } & JSX.IntrinsicElements["input"]
> = ({ symbol }) => {
  const { Modal, toggle } = useModal(<CurrencySelect />);
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
            {symbol}
            <AiOutlineDown size="1rem" />
          </button>
        </div>
        <div className="flex gap-1 justify-end items-center">
          <button className="btn btn-sm btn-ghost">MAX</button>
          <div className="text-sm font-bold badge badge-accent">{`Balance: 0.00`}</div>
        </div>
      </div>
    </>
  );
};
