import { Currency, Token } from "@penta-swap/sdk";

export type SelectedCurrencies = [
  Currency | Token | null,
  Currency | Token | null
];
