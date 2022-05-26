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
      symbol: "ASTR"
    },
    rpcUrls: ["https://astar.blastapi.io/6a492343-ce82-409d-89fe-38838ab38fdd"]
  }
};

export const chainIdTo = (chainId: number | null) => {
  return (
    Object.entries(chainParameters).find(
      ([name, p]) => chainId === p.chainId
    )?.[0] || null
  );
};

export const factoryAddresses: Record<chains, string> = {
  astar: "0xA9473608514457b4bF083f9045fA63ae5810A03E"
};
