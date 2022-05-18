import { chainTokens } from "@/constants/tokens";
import { Currency, Token } from "@penta-swap/sdk";

export const useCurrencyList = (): (Currency | Token)[] => {
  return [Currency.ETHER, ...chainTokens.astar];
};
