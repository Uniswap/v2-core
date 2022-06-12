import { ChainParameter, chains } from "@/constants/chains";
import { useRecoilValue } from "recoil";
import { currentChainState } from "./../store/chain/atom/currentChain";
import { currentChainNameSelector } from "./../store/chain/selector/chainName";

/**
 * @dev マルチチェーン化した時に本実装
 */
export const useCurrentChain = (): { name: chains; perm: ChainParameter } => {
  const chainName = useRecoilValue(currentChainNameSelector);
  const chainPerm = useRecoilValue(currentChainState);
  return { name: chainName, perm: chainPerm };
};
