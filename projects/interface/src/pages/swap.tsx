import { Card, PageContainer } from "@/components/ui";
import { chainTokens } from "@/constants/tokens";
import { CurrencyInput } from "@/features/Currency";
import { Currency, Token } from "@penta-swap/sdk";
import { useState } from "react";

const Swap: React.VFC = () => {
  const [currency1, setCurrency1] = useState<Token | Currency>(Currency.ETHER);
  const [currency2, setCurrency2] = useState<Token | Currency>(
    chainTokens.astar[0] || Currency.ETHER
  );
  return (
    <PageContainer>
      <Card>
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
