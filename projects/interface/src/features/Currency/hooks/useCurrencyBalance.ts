import { ERC20__factory } from "@/lib/contracts";
import { useContract, useWeb3 } from "@inaridiy/useful-web3";
import { Token } from "@penta-swap/sdk";
import { useQuery } from "react-query";

export const useCurrencyBalance = (currency: Token) => {
  const { accounts } = useWeb3();
  const erc20 = useContract(
    (provider) => ERC20__factory.connect(currency.address, provider),
    { chain: currency.chainId }
  );
  const query = useQuery(
    `${currency.chainId}/${currency.address}/${accounts[0] || "0x00"}`,
    () => erc20?.balanceOf(accounts[0] as string),
    { enabled: Boolean(erc20 && accounts[0]) }
  );

  return query;
};
