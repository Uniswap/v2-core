import { chainParameters } from "@/constants/chains";
import { ERC20__factory } from "@/lib/contracts";
import { EIP1193, useContract, useWeb3 } from "@inaridiy/useful-web3";
import { Currency, Token } from "@penta-swap/sdk";
import { ethers } from "ethers";
import { useQuery } from "react-query";

export const useCurrencyBalance = (currency: Currency | Token | null) => {
  const nativeBalance = useNativeCurrencyBalance(chainParameters.astar.chainId);
  const tokenBalance = useTokenBalance(currency);

  if (currency instanceof Token) {
    return tokenBalance;
  } else if (currency === Currency.ETHER) {
    return nativeBalance;
  } else {
    return null;
  }
};

export const useNativeCurrencyBalance = (chainId: number | null) => {
  const { accounts, instance, chainId: currentChainId } = useWeb3();
  const query = useQuery(
    `${chainId as number}/balance/${accounts[0] || "0x00"}`,
    () =>
      new ethers.providers.Web3Provider(instance as EIP1193).getBalance(
        accounts[0] as string
      ),
    {
      enabled: Boolean(
        instance && accounts[0] && chainId && chainId === currentChainId
      )
    }
  );
  return query;
};

export const useTokenBalance = (token: Currency | Token | null) => {
  const { accounts } = useWeb3();
  const erc20 = useContract(
    provider =>
      token instanceof Token
        ? ERC20__factory.connect(token.address, provider)
        : null,
    { chain: token instanceof Token ? token.chainId : 0 }
  );
  const query = useQuery(
    `${(token as Token)?.chainId}/${(token as Token)?.address}/${accounts[0] ||
      "0x00"}`,
    () => erc20?.balanceOf(accounts[0] as string),
    { enabled: Boolean(erc20 && accounts[0] && token instanceof Token) }
  );

  return query;
};
