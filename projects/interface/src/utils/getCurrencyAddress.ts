import { Currency, Token } from "@penta-swap/sdk";
export const getCurrencyAddress = (currency: Currency | Token) => {
  if (currency instanceof Token) {
    return currency.address;
  } else {
    return undefined;
  }
};
