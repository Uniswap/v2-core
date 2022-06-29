import { chainParameters, chains } from "@/constant/chains";

export const chainIdToName = (chainId: number): chains | null => {
  const name = Object.keys(chainParameters).find(
    (name) => chainParameters[name as chains].chainId === chainId
  ) as chains | undefined;
  return name || null;
};
