import { ChainParameter, chainParameters, chains } from "@/constants/chains";
import { selector } from "recoil";
import { currentChainState } from "../atom";
export const currentChainNameSelector = selector<chains>({
  key: "currentChainName",
  get({ get }) {
    const { chainId: currentChainId } = get(currentChainState);
    const [name] = Object.entries(chainParameters).find(
      ([, { chainId }]) => chainId === currentChainId
    ) as [chains, ChainParameter];
    return name;
  },
  set({ set }, newName) {
    typeof newName === "string" &&
      set(currentChainState, chainParameters[newName]);
  },
});
