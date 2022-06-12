import { selector } from "recoil";
import { currenciesState } from "../currency";
import { currentChainNameSelector } from "./../chain";

export const currentCurrenciesSelector = selector({
  key: "currentCurrencies",
  get({ get }) {
    const currentChainName = get(currentChainNameSelector);
    const currencies = get(currenciesState(currentChainName));
    return currencies;
  },
});
