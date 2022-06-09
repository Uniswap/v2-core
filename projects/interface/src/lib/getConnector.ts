import { MetamaskConnector } from "@inaridiy/useful-web3";

export const getConnector = () => {
  return new MetamaskConnector();
};
