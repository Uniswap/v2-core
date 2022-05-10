import { Card, PageContainer } from "../ui";

const CurrencyInput: React.VFC<
  { symbol: string } & JSX.IntrinsicElements["input"]
> = ({ symbol, ...props }) => {
  return (
    <div className="input-group input-group-lg">
      <input
        type="text"
        placeholder="0.0"
        className="text-2xl font-bold input input-lg input-bordered"
        {...{ props }}
      />
      <div className="grow btn btn-lg">{symbol}</div>
    </div>
  );
};

const Swap: React.VFC = () => {
  return (
    <PageContainer>
      <Card>
        <div className="card-body">
          <h2 className="text-xl card-title">Swap</h2>
          <CurrencyInput symbol="ASTR" />
          <CurrencyInput symbol="INR" />
          <div className="card-actions">
            <button className="btn">Approve</button>
            <button className="btn">Add Liquidity</button>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
};

export default Swap;
