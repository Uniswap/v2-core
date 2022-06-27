export const parseChainId = (chainId: any): number =>
  typeof chainId === "number"
    ? chainId
    : chainId.chainId
    ? parseChainId(chainId.chainId)
    : parseInt(chainId, 16);
