import { parseChainId } from "@/utils/parseChainId";
import { invariant } from "react-router/lib/router";
import type { Connector, EIP1193 } from "./types";

/**
 * @dev Metamaskを使ってwalletに接続する
 */
export const metamaskConnector: Connector = async () => {
  const { default: detector } = await import("@metamask/detect-provider");
  const eip1193 = (await detector()) as EIP1193;
  invariant(eip1193 && eip1193?.request, "Unauthorized Wallet");

  const [chainId, accounts] = (await Promise.all([
    eip1193.request({ method: "eth_chainId" }),
    eip1193.request({ method: "eth_requestAccounts" }),
  ])) as [string, string[]];

  return [eip1193, parseChainId(chainId), accounts];
};
