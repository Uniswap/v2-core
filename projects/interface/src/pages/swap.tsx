import { Card, PageContainer } from "@/components/ui";
import { chainTokens } from "@/constants/tokens";
import { CurrencyInput } from "@/features/Currency";
import { Currency } from "@penta-swap/sdk";

const Swap: React.VFC = () => {
  return (
    <PageContainer>
      <Card>
        <div className="gap-4 card-body">
          <h2 className="text-xl card-title">Swap</h2>
          <CurrencyInput currency={Currency.ETHER} />
          <CurrencyInput currency={chainTokens.astar[1] || Currency.ETHER} />
          <button className="w-full btn btn-primary">Swap</button>
        </div>
      </Card>
    </PageContainer>
  );
};

export default Swap;
