import { multiCallAddresses } from "@/constants/chains";
import { MultiCall__factory } from "@/lib/contracts";
import { useContract } from "@inaridiy/useful-web3";
import { BytesLike } from "ethers";
import { useQuery } from "react-query";
import { useCurrentChain } from "./useCurrentChain";

export type callData = {
  target: string;
  callData: BytesLike;
};

export const useMultiCallContract = () => {
  const {
    name,
    perm: { chainId }
  } = useCurrentChain();
  const contract = useContract(
    provider => MultiCall__factory.connect(multiCallAddresses[name], provider),
    { chain: chainId }
  );

  return contract;
};

export const useMultiCall = (calldataList: callData[]) => {
  const contract = useMultiCallContract();
  const query = useQuery(
    ["multicall", ...calldataList],
    () => contract?.callStatic.aggregate(calldataList),
    {
      enabled: Boolean(contract),
      retry: false,
      refetchInterval: false
    }
  );
  return query;
};
