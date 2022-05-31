import { Currency } from "@penta-swap/sdk";
import { utils } from "ethers";

export const parseCurrency = (
  currency: Currency | null,
  amount: string | undefined
) => utils.parseUnits(amount || "0", currency?.decimals || 18).toString() || 0;
