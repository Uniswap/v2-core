import { Card, PageContainer } from "@/components/ui";
import { CurrencyInput } from "@/features/Currency";
import { useCurrencyInput } from "@/features/Currency/hooks/useCurrencyInput";
import { usePair } from "@/features/Trade/hooks/usePair";

const Swap: React.VFC = () => {
  const {
    currency1,
    currency2,
    setCurrency1,
    setCurrency2
  } = useCurrencyInput();
  usePair(currency1, currency2);
  return (
    <PageContainer>
      <Card className="w-full max-w-screen-sm">
        <div className="gap-4 card-body">
          <h2 className="text-xl card-title">Swap</h2>
          <CurrencyInput
            label="From"
            currency={currency1}
            onSelect={setCurrency1}
          />
          <CurrencyInput
            label="To"
            currency={currency2}
            onSelect={setCurrency2}
          />
          <button className="w-full btn btn-primary">Swap</button>
        </div>
      </Card>
    </PageContainer>
  );
};

export default Swap;
