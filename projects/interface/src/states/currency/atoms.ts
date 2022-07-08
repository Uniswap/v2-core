import { chains } from "@/constant/chains";
import { logos, nativeLogos } from "@/constant/logos";
import { atomFamily } from "recoil";
export const CurrencyLogoStates = atomFamily<
  string | undefined,
  string | undefined
>({
  key: "CurrencyLogoStates",
  default: (address = "0x00") =>
    address in logos ? logos[address as keyof typeof logos] : undefined,
});

export const nativeLogoStates = atomFamily<string, chains>({
  key: "nativeLogoStates",
  default: (chainName) => nativeLogos[chainName],
});
