import { useWeb3 } from "@/hooks";

export const AccountInfo: React.FC = () => {
  const { accounts } = useWeb3();
  return <div>{accounts[0]}</div>;
};
