import { useMultipleContractData } from "@/hooks";
import { ERC20_INTERFACE } from "@/lib/interfaces";
import { currentCurrenciesSelector } from "@/store/selector";
import { useWeb3 } from "@inaridiy/useful-web3";
import { Token } from "@penta-swap/sdk";
import { useRecoilValue } from "recoil";

export const useCurrencyBalances = () => {
  const currencies = useRecoilValue(currentCurrenciesSelector);
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
