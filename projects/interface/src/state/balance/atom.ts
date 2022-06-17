import { BigNumber } from "ethers";
import { atomFamily } from "recoil";

export const balances = atomFamily<BigNumber, string>({
  key: "balance",
  default: () => BigNumber.from(0),
});
