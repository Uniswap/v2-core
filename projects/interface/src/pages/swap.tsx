import { Card, PageContainer } from "@/components/ui";
import { CurrencyInput } from "@/features/Currency";
import { useCurrencyInput } from "@/features/Currency/hooks/useCurrencyInput";
import { TradeInfo } from "@/features/Trade/components/TradeInfo";
import { AiOutlineArrowDown, AiOutlineSetting } from "react-icons/ai";

const Swap: React.VFC = () => {
  const {
    toggle,
    currency1,
    currency2,
    setCurrency1,
    setCurrency2
  } = useCurrencyInput();

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
            currency={currency1}
            onSelect={setCurrency1}
          />

          <button
            className="z-10 -my-4 mx-auto w-12 btn btn-sm  btn-circle btn-primary"
            onClick={toggle}
          >
            <AiOutlineArrowDown size="1.5rem" />
          </button>

          <CurrencyInput
            label="To"
            currency={currency2}
            onSelect={setCurrency2}
          />
          <TradeInfo
            {...{ currency1, currency2, amount: "1" + "0".repeat(18) }}
          />
          <button className="w-full btn btn-primary">Swap</button>
        </div>
      </Card>
    </PageContainer>
  );
};

export default Swap;
