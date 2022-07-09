import { chains } from "@/constant/chains";
import { logos, nativeLogos } from "@/constant/logos";
import { chainTokens } from "@/constant/tokens";
import { Currency } from "@penta-swap/sdk";
import { atomFamily } from "recoil";
import { Currencies } from "./types";

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

export const currenciesStates = atomFamily<Currencies, chains>({
  key: "currencies",
  default: (chain) => [Currency.ETHER, ...chainTokens[chain]],
});
