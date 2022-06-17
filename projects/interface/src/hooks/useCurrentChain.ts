import { ChainParameter, chains } from "@/constants/chains";
import { currentChainNameSelector, currentChainState } from "@/store";
import { useRecoilValue } from "recoil";

export const useCurrentChain = (): { name: chains; perm: ChainParameter } => {
  const chainName = useRecoilValue(currentChainNameSelector);
  const chainPerm = useRecoilValue(currentChainState);
  return { name: chainName, perm: chainPerm };
};
