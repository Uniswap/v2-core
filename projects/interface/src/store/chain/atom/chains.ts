import { ChainParameter, chainParameters, chains } from "@/constants/chains";
import { atomFamily } from "recoil";

export const chainsState = atomFamily<ChainParameter, chains>({
  key: "chains",
  default: (name) => chainParameters[name],
});
