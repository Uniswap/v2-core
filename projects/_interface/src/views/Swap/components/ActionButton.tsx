import { ConnectWallet, SwitchNetwork } from "@/components/Buttons";
import { useCurrencyBalance } from "@/features/Currency";
import { wrapCurrency } from "@/features/Trade";
import { useCurrentChain } from "@/hooks";
import { useWeb3 } from "@inaridiy/useful-web3";
import { Currency, Trade } from "@penta-swap/sdk";
import { Currencies } from "../types";

export const ActionButton: React.FC<{
  currencies: Currencies;
  trade: Trade | null;
}> = ({
  currencies: { from: currency1, to: currency2 },
  currencies,
  trade
}) => {
  const { chainId, accounts, connectWallet } = useWeb3();
  const { data: balance } = useCurrencyBalance(currency1);
  const { perm } = useCurrentChain();

  const isNativePair =
    wrapCurrency(currency1)?.address === wrapCurrency(currency2)?.address;

  // console.log(
  //   balance && balance.toString(),
  //   trade && trade.inputAmount.raw.toString()
  // );

  if (accounts.length == 0) {
    return <ConnectWallet className="btn" />;
  } else if (chainId !== perm.chainId) {
    return <SwitchNetwork className="btn btn-error" />;
  } else if (trade && balance && balance.lt(trade.inputAmount.raw.toString())) {
    return (
      <button className="btn btn-error">
        {`Insufficient ${currency1?.symbol || ""} Balance`}
      </button>
    );
  } else if (isNativePair && currency1 === Currency.ETHER) {
    return <WrapButton trade={trade} />;
  } else if (isNativePair && currency2 === Currency.ETHER) {
    return <UnWrapButton trade={trade} />;
  } else {
    return <button className="ring sm:mt-2 btn">Swap</button>;
  }
};

export const WrapButton: React.FC<{ trade: Trade | null }> = ({ trade }) => {
  return <button className="btn">Wrap</button>;
};

export const UnWrapButton: React.FC<{ trade: Trade | null }> = ({ trade }) => {
  return <button className="btn">UNWrap</button>;
};
