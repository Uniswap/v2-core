import { Currency } from "@penta-swap/sdk";
import { utils } from "ethers";

export const parseCurrency = (
  currency: Currency | null,
  amount: string | undefined
) => {
  return utils
    .parseUnits(
      amount ? Number(amount).toString() : "0",
      currency?.decimals || 18
    )
    .toString();
};
