import { ERC20__factory } from "@/lib/contracts";
import { EIP1193, useContract, useWeb3 } from "@inaridiy/useful-web3";
import { Currency, Token } from "@penta-swap/sdk";
import { ethers } from "ethers";
import { useQuery } from "react-query";

export const useCurrencyBalance = (currency: Token | Currency) => {
  if (currency instanceof Token) {
    return useTokenBalance(currency);
  } else if (currency === Currency.ETHER) {
    return useNativeCurrencyBalance(592);
  } else {
    throw new Error("Currency is wrong.");
  }
};

export const useNativeCurrencyBalance = (chainId: number) => {
  const { accounts, instance, chainId: currentChainId } = useWeb3();
  const query = useQuery(
    `${chainId}/balance/$${accounts[0] || "0x00"}`,
    () =>
      new ethers.providers.Web3Provider(instance as EIP1193).getBalance(
        accounts[0] as string
      ),
    { enabled: Boolean(instance && accounts[0] && chainId === currentChainId) }
  );
  return query;
};

export const useTokenBalance = (token: Token) => {
  const { accounts } = useWeb3();
  const erc20 = useContract(
    (provider) => ERC20__factory.connect(token.address, provider),
    { chain: token.chainId }
  );
  const query = useQuery(
    `${token.chainId}/${token.address}/${accounts[0] || "0x00"}`,
    () => erc20?.balanceOf(accounts[0] as string),
    { enabled: Boolean(erc20 && accounts[0]) }
  );

  return query;
};
