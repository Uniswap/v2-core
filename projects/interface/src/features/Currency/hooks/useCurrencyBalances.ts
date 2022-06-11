import { multiCallAddresses } from "@/constants/chains";
import { useCurrentChain, useMultiCall } from "@/hooks";
import { ERC20__factory, MultiCall__factory } from "@/lib/contracts";
import { useWeb3 } from "@inaridiy/useful-web3";
import { Currency, Token } from "@penta-swap/sdk";
import { useMemo } from "react";

export const useCurrencyBalanceCallDataList = (
  currencies: (Currency | Token)[]
) => {
  const { accounts } = useWeb3();
  const { name } = useCurrentChain();
  const iErc20 = useMemo(() => ERC20__factory.createInterface(), []);
  const iMulticall = useMemo(() => MultiCall__factory.createInterface(), []);
  const callDataList = useMemo(
    () =>
      currencies.map((currency) =>
        currency instanceof Token
          ? {
              target: currency.address,
              callData: iErc20.encodeFunctionData("balanceOf", [accounts[0]]),
            }
          : {
              target: multiCallAddresses[name],
              callData: iMulticall.encodeFunctionData("getEthBalance", [
                accounts[0],
              ]),
            }
      ),
    [accounts, name]
  );
  return callDataList;
};

const useDecodeCurrencyBalanceResults = (
  currencies: (Currency | Token)[],
  results: string[]
) => {};

export const useCurrencyBalances = (currencies: (Currency | Token)[]) => {
  const callDataList = useCurrencyBalanceCallDataList(currencies);
  const { data, ...queryState } = useMultiCall(callDataList);
};
