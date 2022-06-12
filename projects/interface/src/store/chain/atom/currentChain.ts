import { chainParameters } from "@/constants/chains";
import { atom } from "recoil";
export const currentChainState = atom({
  key: "currentCain",
  default: chainParameters["astar"],
});
