import { chainParameters } from "@/constants/chains";
import { Currency, Fetcher, Token } from "@penta-swap/sdk";
import { ethers } from "ethers";
import { useQuery } from "react-query";
import { wrapCurrency } from "../util/wrapCurrency";

export const usePair = (
  currency1: Token | Currency | null,
  currency2: Token | Currency | null
) => {
  const [token1, token2] = [wrapCurrency(currency1), wrapCurrency(currency2)];

  const query = useQuery(
    `${token1?.chainId || -1}/pair/${token1?.address ||
      "0x00"}-${token2?.address || "0x00"}`,
    () =>
      Fetcher.fetchPairData(
        token1 as Token,
        token2 as Token,
        new ethers.providers.JsonRpcProvider(chainParameters.astar.rpcUrls[0])
      ),
    {
      enabled: Boolean(token1 && token2 && token1.chainId === token2.chainId)
    }
  );

  return query;
};
