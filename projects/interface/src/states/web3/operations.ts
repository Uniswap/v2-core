import { Connector } from "@/libs/connectors";
import { parseChainId } from "@/utils/parseChainId";
import { useRecoilCallback } from "recoil";
import { accountsState, connectingChainIdState, eip1193State } from "./atom";

export const useConnectWallet = () => {
  const connectWallet = useRecoilCallback(
    ({ set }) =>
      async (connector: Connector) => {
        const [eip1193, chainId, accounts] = await connector();
        set(eip1193State, eip1193);
        set(connectingChainIdState, chainId);
        set(accountsState, accounts);

        eip1193.on("chainChanged", (chainId) =>
          set(connectingChainIdState, parseChainId(chainId))
        );
        eip1193.on("accountsChanged", (accounts) =>
          set(accountsState, accounts)
        );
        eip1193.on("disconnect", () => {
          set(connectingChainIdState, null);
          set(accountsState, []);
        });
      }
  );
  return connectWallet;
};
