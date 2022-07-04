import {
  connectingChainIdState,
  useConnectWallet,
  useDisconnect,
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
  const disconnect = useDisconnect();
  const accounts = useRecoilValue(accountsSelector);
  const connectingChain = useRecoilValue(connectingChainIdState);
  const currentChainName = useRecoilValue(currentChainNameSelector);
  const isConnected = Boolean(accounts.length);

  return {
    connectWallet,
    switchChain,
    disconnect,
    accounts,
    connectingChain,
    currentChainName,
    isConnected,
  };
};
