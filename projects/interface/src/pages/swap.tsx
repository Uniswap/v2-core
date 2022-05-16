import { Card, PageContainer } from "@/components/ui";
import { CurrencyInput } from "@/features/Swap";

const Swap: React.VFC = () => {
  return (
    <PageContainer>
      <Card>
        <div className="gap-4 card-body">
          <h2 className="text-xl card-title">Swap</h2>
          <CurrencyInput symbol="ASTR" />
          <CurrencyInput symbol="INR" />
          <button className="w-full btn btn-primary">Swap</button>
        </div>
      </Card>
    </PageContainer>
  );
};

export default Swap;
