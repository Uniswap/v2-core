import { PageContainer, Card } from "../ui";

const Swap: React.VFC = () => {
  return (
    <PageContainer>
      <Card className="w-96 h-64">
        <div className="card-body">
          <h2 className="card-title text-xl">Swap</h2>
          <input type="text" />
          <input type="text" />
        </div>
      </Card>
    </PageContainer>
  );
};

export default Swap;
