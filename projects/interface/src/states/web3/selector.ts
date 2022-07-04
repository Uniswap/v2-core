import { ChainParameter, chainParameters, chains } from "@/constant/chains";
import { ethers } from "ethers";
import { selector } from "recoil";
import { addressesState, currentChainState, eip1193State } from "./atom";
import { Account } from "./types";

export const providerSelector = selector<null | ethers.providers.Provider>({
  key: "provider",
  get: ({ get }) => {
    const eip1193 = get(eip1193State);
    const web3Provider = eip1193
      ? new ethers.providers.Web3Provider(eip1193)
      : null;
    return web3Provider;
  },
});

export const currentChainNameSelector = selector<chains>({
  key: "currentChainName",
  get({ get }) {
    const { chainId: currentChainId } = get(currentChainState);
    const [name] = Object.entries(chainParameters).find(
      ([, { chainId }]) => chainId === currentChainId
    ) as [chains, ChainParameter];
    return name;
  },
  set({ set }, newName) {
    typeof newName === "string" &&
      set(currentChainState, chainParameters[newName]);
  },
});

export const accountsSelector = selector<Account[]>({
  key: "accountsD",
  get({ get }) {
    const accounts = get(addressesState);
    return accounts.map((address) => ({
      address,
      ellipsisAddress: `${accounts[0].slice(0, 5)}...${accounts[0].slice(-4)}`,
    }));
  },
});
