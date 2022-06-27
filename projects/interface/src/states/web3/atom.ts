import type { ChainParameter, chains } from "@/constant/chains";
import { chainParameters } from "@/constant/chains";
import { EIP1193 } from "@/libs/connectors";
import { atom, atomFamily } from "recoil";

export const eip1193State = atom<EIP1193 | null>({
  key: "eip1193",
  default: null,
  dangerouslyAllowMutability: true,
});

export const accountsState = atom<string[]>({
  key: "accounts",
  default: [],
});

export const chainsState = atomFamily<ChainParameter, chains>({
  key: "chains",
  default: (name) => chainParameters[name],
});

export const currentChainState = atom({
  key: "currentChain",
  default: chainParameters["astar"],
});

export const connectingChainIdState = atom<number | null>({
  key: "connectingChain",
  default: null,
});
