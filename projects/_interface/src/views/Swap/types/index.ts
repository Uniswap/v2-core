import { Currency, Token } from "@penta-swap/sdk";

export type Currencies = {
  from: Currency | Token | null;
  to: Currency | Token | null;
};
