import { selector } from "recoil";
import { currencySearchInputState } from "../input";
import { currentCurrenciesSelector } from "./currentCurrencies";

export const sortedCurrenciesSelector = selector({
  key: "sortedCurrencies",
  get({ get }) {
    const input = get(currencySearchInputState);
    const currentCurrencies = get(currentCurrenciesSelector);
    const sortedCurrencies = currentCurrencies.filter(
      (currency) =>
        currency.name?.toLocaleLowerCase().includes(input.toLowerCase()) ||
        currency.symbol?.toLocaleLowerCase().includes(input.toLowerCase())
    );
    return sortedCurrencies;
  },
});
