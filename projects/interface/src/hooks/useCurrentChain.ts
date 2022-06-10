import { ChainParameter, chainParameters, chains } from "@/constants/chains";

/**
 * @dev マルチチェーン化した時に本実装
 */
export const useCurrentChain = (): { name: chains; perm: ChainParameter } => {
  return { name: "astar", perm: chainParameters.astar };
};
