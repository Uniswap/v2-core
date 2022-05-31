import { Card, PageContainer } from "@/components/ui";
import { CurrencyInput } from "@/features/Currency";
import { TradeInfo } from "@/features/Trade/components/TradeInfo";
import { AiOutlineArrowDown, AiOutlineSetting } from "react-icons/ai";
import { useSwapHandle } from "./hooks";

const Swap: React.VFC = () => {
  const {
    currencies,
    setCurrencies,
    trade,
    isLoading,
    amounts,
    setAmount
  } = useSwapHandle();

  return (
    <PageContainer>
      <Card className="w-full max-w-screen-sm">
        <div className="gap-1 px-4 pt-2 pb-4 sm:px-8 card-body">
          <div className="flex justify-between">
            <h2 className="text-xl card-title">Swap</h2>
            <button className="btn btn-ghost btn-circle">
              <AiOutlineSetting size="1.5rem" />
            </button>
          </div>
          <CurrencyInput
            label="From"
            currency={currencies["from"]}
            onSelect={setCurrencies["from"]}
            onChange={setAmount["from"]}
            value={amounts["from"]}
          />

          <button
            className="z-10 -my-4 mx-auto w-12 btn btn-sm  btn-circle btn-primary"
            //   onClick={toggle}
          >
            <AiOutlineArrowDown size="1.5rem" />
          </button>

          <CurrencyInput
            label="To"
            currency={currencies["to"]}
            onSelect={setCurrencies["to"]}
            onChange={setAmount["to"]}
            value={amounts["to"]}
          />
          <TradeInfo {...{ trade, isLoading }} />
          <button className="mt-2 w-full btn btn-primary">Swap</button>
        </div>
      </Card>
    </PageContainer>
  );
};

export default Swap;
