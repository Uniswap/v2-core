import {
  accountsState,
  connectingChainIdState,
  useConnectWallet,
  useSwitchChain,
} from "@/states/web3";
import { currentChainNameSelector } from "@/states/web3/selector";
import { useRecoilValue } from "recoil";

export const useWeb3 = () => {
  const connectWallet = useConnectWallet();
  const switchChain = useSwitchChain();
  const accounts = useRecoilValue(accountsState);
  const connectingChain = useRecoilValue(connectingChainIdState);
  const currentChainName = useRecoilValue(currentChainNameSelector);

  return {
    connectWallet,
    switchChain,
    accounts,
    connectingChain,
    currentChainName,
  };
};
