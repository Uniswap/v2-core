import { chainParameters } from "@/constants/chains";

export const useCurrentChain = () => {
  return { name: "astar", perm: chainParameters.astar };
};
