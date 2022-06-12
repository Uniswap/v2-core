import { Currency } from "@penta-swap/sdk";
import { atom } from "recoil";
import { SelectedCurrencies } from "../types";

export const selectedCurrencies = atom<SelectedCurrencies>({
  key: "selectedCurrencies",
  default: [Currency.ETHER, null],
});
