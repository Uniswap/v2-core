import { selector } from "recoil";
import { currentChainNameSelector } from "../web3";
import { nativeLogoStates } from "./atoms";

export const nativeLogoSelector = selector({
  key: "nativeLogoSelector",
  get({ get }) {
    const chainName = get(currentChainNameSelector);
    const nativeLogo = get(nativeLogoStates(chainName));
    return nativeLogo;
  },
});
