import { selector } from "recoil";
import { currentChainNameSelector } from "../chain";
import { currenciesState } from "../currency";

export const currentCurrenciesSelector = selector({
  key: "currentCurrencies",
  get({ get }) {
    const currentChainName = get(currentChainNameSelector);
    const currencies = get(currenciesState(currentChainName));
    return currencies;
  },
});
