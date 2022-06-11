import { multiCallAddresses } from "@/constants/chains";
import { useCurrentChain, useMultiCall } from "@/hooks";
import { ERC20__factory, MultiCall__factory } from "@/lib/contracts";
import { useWeb3 } from "@inaridiy/useful-web3";
import { Currency, Token } from "@penta-swap/sdk";
import { BigNumber } from "ethers";
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
) => {
  const iErc20 = useMemo(() => ERC20__factory.createInterface(), []);
  const iMulticall = useMemo(() => MultiCall__factory.createInterface(), []);
  return results.map(
    (result, i) =>
      (
        (currencies[i] instanceof Token
          ? iErc20.decodeFunctionResult("balanceOf", result)
          : iMulticall.decodeFunctionResult("getEthBalance", result)) as [
          BigNumber
        ]
      )[0]
  );
};

export const useCurrencyBalances = (currencies: (Currency | Token)[]) => {
  const callDataList = useCurrencyBalanceCallDataList(currencies);
  const { data, ...queryState } = useMultiCall(callDataList);
  const balances = useDecodeCurrencyBalanceResults(currencies, data?.[1] || []);
  return { balances, queryState };
};
