import type { ethers } from "ethers";

type EIP1193Events = {
  accountsChanged: (ids: string[]) => void;
  chainChanged: (chainId: string) => void;
  disconnect: () => void;
};

export interface EIP1193 extends ethers.providers.ExternalProvider {
  isMetaMask?: boolean;
  on: <T extends keyof EIP1193Events>(
    event: T,
    callback: EIP1193Events[T]
  ) => void;
}

export interface Connector {
  connect(): Promise<[eip1193: EIP1193, chainId: number, accounts: string[]]>;
  isValid(): Promise<boolean>;
}
