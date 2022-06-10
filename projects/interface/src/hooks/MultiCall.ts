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
    perm: { rpcUrls }
  } = useCurrentChain();
  const contract = useContract(
    provider => MultiCall__factory.connect(multiCallAddresses[name], provider),
    { fetchOnly: true, fallbackRpc: rpcUrls[0] as string }
  );

  return contract;
};

export const useMultiCall = (calldataList: callData[]) => {
  const contract = useMultiCallContract();

  const query = useQuery(
    ["multicall", ...calldataList],
    () => {
      const promise = contract?.callStatic.aggregate(calldataList);
      //  void promise?.then(e => console.log(calldataList.length, e.returnData));
      return promise;
    },
    {
      enabled: Boolean(contract)
    }
  );

  return query;
};
