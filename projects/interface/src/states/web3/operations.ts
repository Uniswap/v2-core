import { ChainParameter } from "@/constant/chains";
import { Connector } from "@/libs/connectors";
import { chainIdToName } from "@/utils/chainIdToName";
import invariant from "@/utils/invariant";
import { parseChainId } from "@/utils/parseChainId";
import { useRecoilCallback } from "recoil";
import { accountsState, connectingChainIdState, eip1193State } from "./atom";
import { currentChainNameSelector } from "./selector";

export const useConnectWallet = () => {
  const connectWallet = useRecoilCallback(
    ({ set }) =>
      async (connector: Connector) => {
        const [eip1193, chainId, accounts] = await connector();
        const connectingChainName = chainIdToName(chainId);
        connectingChainName &&
          set(currentChainNameSelector, connectingChainName);
        set(eip1193State, eip1193);
        set(connectingChainIdState, chainId);
        set(accountsState, accounts);

        eip1193.on("chainChanged", (chainId) => {
          const connectingChainName = chainIdToName(parseChainId(chainId));
          connectingChainName &&
            set(currentChainNameSelector, connectingChainName);
          set(connectingChainIdState, parseChainId(chainId));
        });
        eip1193.on("accountsChanged", (accounts) => {
          set(accountsState, accounts);
        });
        eip1193.on("disconnect", () => {
          set(connectingChainIdState, null);
          set(accountsState, []);
        });
      }
  );
  return connectWallet;
};

export const useSwitchChain = () => {
  const switchChain = useRecoilCallback(
    ({ set, snapshot }) =>
      async (param: ChainParameter) => {
        const eip1193 = snapshot.getLoadable(eip1193State).getValue();
        invariant(eip1193 && eip1193.request);
        await eip1193.request({
          method: "wallet_addEthereumChain",
          params: [param],
        });
        await eip1193.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: param.chainId }],
        });

        const connectingChainName = chainIdToName(param.chainId);
        connectingChainName &&
          set(currentChainNameSelector, connectingChainName);
        set(connectingChainIdState, param.chainId);
      }
  );
  return switchChain;
};
