import { Connector, MetamaskConnector } from "@/libs/connectors";

export type connectMethod = [
  name: string,
  symbol: string,
  connector: Connector
];

export type connectMethodNames = "Metamask";

export const connectMethods: { [key in connectMethodNames]: connectMethod } = {
  Metamask: [
    "Metamask",
    "/connecter/metamask-fox.svg",
    new MetamaskConnector(),
  ],
};
