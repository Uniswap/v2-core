import { ChainParameter, chainParameters, chains } from "@/constants/chains";
import { atom, atomFamily } from "recoil";

export const chainsState = atomFamily<ChainParameter, chains>({
  key: "chains",
  default: (name) => chainParameters[name],
});

export const currentChainState = atom({
  key: "currentCain",
  default: chainParameters["astar"],
});
