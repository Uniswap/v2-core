export const parseChainId = (chainId: number | string): number =>
  typeof chainId === "number" ? chainId : parseInt(chainId, 16);
