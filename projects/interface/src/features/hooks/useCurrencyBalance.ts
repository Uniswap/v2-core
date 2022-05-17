import { useWeb3 } from "@inaridiy/useful-web3";
import { Token } from "@penta-swap/sdk";
import { useQuery } from "react-query";

export const useCurrencyBalance = (currency: Token) => {
  const { accounts } = useWeb3();
  const { data } = useQuery(
    `${currency.chainId}/${currency.address}/${accounts[0] || "0x00"}`
  );
};
