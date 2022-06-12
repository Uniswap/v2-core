import { chains } from "@/constants/chains";
import { chainTokens } from "@/constants/tokens";
import { atomFamily } from "recoil";
import { Currencies } from "../types";

export const currenciesState = atomFamily<Currencies, chains>({
  key: "currencies",
  default: (chain) => chainTokens[chain],
});
