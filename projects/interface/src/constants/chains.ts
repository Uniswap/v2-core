export interface ChainParameter {
  chainId: number;
  blockExplorerUrls: string[];
  chainName: string;
  iconUrls: string[];
  nativeCurrency: {
    decimals: 18;
    name: string;
    symbol: string;
  };
  rpcUrls: string[];
}

export type chains = "astar";

export type ChainParameters = Record<chains, ChainParameter>;

export const chainParameters: ChainParameters = {
  astar: {
    chainId: 592,
    blockExplorerUrls: ["https://astar.subscan.io"],
    chainName: "Astar Network",
    iconUrls: [],
    nativeCurrency: {
      decimals: 18,
      name: "ASTR",
      symbol: "ASTR",
    },
    rpcUrls: ["https://evm.astar.network/"],
  },
};

export const factoryAddresses: Record<chains, string> = {
  astar: "0xA9473608514457b4bF083f9045fA63ae5810A03E",
};
