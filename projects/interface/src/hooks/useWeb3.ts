import {
  connectingChainIdState,
  useConnectWallet,
  useSwitchChain,
} from "@/states/web3";
import {
  accountsSelector,
  currentChainNameSelector,
} from "@/states/web3/selector";
import { useRecoilValue } from "recoil";

export const useWeb3 = () => {
  const connectWallet = useConnectWallet();
  const switchChain = useSwitchChain();
  const accounts = useRecoilValue(accountsSelector);
  const connectingChain = useRecoilValue(connectingChainIdState);
  const currentChainName = useRecoilValue(currentChainNameSelector);
  const isConnected = Boolean(accounts.length);

  return {
    connectWallet,
    switchChain,
    accounts,
    connectingChain,
    currentChainName,
    isConnected,
  };
};
