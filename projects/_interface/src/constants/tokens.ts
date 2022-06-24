import { Token } from "@penta-swap/sdk";
import { chains } from "./chains";
import { astarTokens } from "./tokens/astar";

export const chainTokens: { [chain in chains]: Token[] } = {
  astar: astarTokens,
};
