import { AiOutlineDown } from "react-icons/ai";

export const CurrencyInput: React.VFC<
  { symbol: string } & JSX.IntrinsicElements["input"]
> = ({ symbol }) => {
  return (
    <>
      <div className="p-3 border-2 border-base-100 hover:border-neutral card bg-base-200">
        <div className="flex gap-2 justify-between items-center">
          <input
            type="number"
            placeholder="0.0"
            className="w-full text-3xl font-bold bg-transparent outline-none"
          />

          <button className="gap-2 text-xl font-bold btn">
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
