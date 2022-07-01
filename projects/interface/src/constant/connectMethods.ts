import { Connector, MetamaskConnector } from "@/libs/connectors";

export type connectMethod = [
  name: string,
  symbol: string,
  connector: Connector
];

export const connectMethods: connectMethod[] = [
  ["Metamask", "/connecter/metamask-fox.svg", new MetamaskConnector()],
];
