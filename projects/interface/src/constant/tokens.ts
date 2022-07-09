import { Token } from "@penta-swap/sdk";
import { chains } from "./chains";

export const chainTokens: { [chain in chains]: Token[] } = {
  astar: [
    new Token(
      592,
      "0xAeaaf0e2c81Af264101B9129C00F4440cCF0F720",
      18,
      "WASTR",
      "Wrapped Astar"
    ),
    new Token(
      592,
      "0x81ECac0D6Be0550A00FF064a4f9dd2400585FE9c",
      18,
      "WETH",
      "Wrapped Ether"
    ),
    new Token(
      592,
      "0xad543f18cFf85c77E140E3E5E3c3392f6Ba9d5CA",
      8,
      "WBTC",
      "Wrapped BTC"
    ),
    new Token(
      592,
      "0x75364D4F779d0Bd0facD9a218c67f87dD9Aff3b4",
      18,
      "SDN",
      "Shiden Network"
    ),
    new Token(
      592,
      "0x6a2d262D56735DbA19Dd70682B39F6bE9a931D98",
      6,
      "USDC",
      "USD Coin"
    ),
    new Token(
      592,
      "0x3795C36e7D12A8c252A20C5a7B455f7c57b60283",
      6,
      "USDT",
      "Tether USD"
    ),
    new Token(
      592,
      "0x7f27352D5F83Db87a5A3E00f4B07Cc2138D8ee52",
      18,
      "BNB",
      "Binance Coin"
    ),
    new Token(
      592,
      "0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB",
      18,
      "JPYC",
      "JPY Coin"
    ),
    new Token(
      592,
      "0x69c3b45D5b90A3E83B2d054eEE62A85E4D0FeC20",
      18,
      "INAT",
      "Inari Token"
    ),
  ],
};
