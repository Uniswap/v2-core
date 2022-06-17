import { useMultiCallContract, useMultipleContractData } from "@/hooks";
import { ERC20_INTERFACE } from "@/lib/interfaces";
import { useWeb3 } from "@inaridiy/useful-web3";
import { Token } from "@penta-swap/sdk";
import { useQuery } from "react-query";
import { Currencies } from "./";

export const useNativeBalance = () => {
  const { accounts, chainId } = useWeb3();
  const multiCall = useMultiCallContract();
  const query = useQuery(
    ["nativeBalance", chainId, accounts],
    () => multiCall.getEthBalance(accounts[0] as string),
    { enabled: Boolean(accounts[0] && chainId) }
  );
};

export const useCurrencyBalances = (
  account: string,
  currencies: Currencies
) => {
  const { accounts } = useWeb3();
  const addresses = currencies
    .filter((currency): currency is Token => currency instanceof Token)
    .map((token) => token.address);
  const { results } = useMultipleContractData(
    "currencyBalances",
    addresses,
    ERC20_INTERFACE,
    "balanceOf",
    [accounts[0] as string],
    { enabled: Boolean(accounts[0]) }
  );
  console.log(results);
  return {};
};
