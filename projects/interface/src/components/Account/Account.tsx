import { useWeb3 } from "@/hooks";
import { AccountConnect } from "./AccountConnect";
import { AccountInfo } from "./AccountInfo";

export const Account: React.FC = () => {
  const { isConnected } = useWeb3();
  if (isConnected) {
    return <AccountInfo />;
  } else {
    return <AccountConnect />;
  }
};
