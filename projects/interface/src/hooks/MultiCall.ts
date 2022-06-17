import { multiCallAddresses } from "@/constants/chains";
import { MultiCall, MultiCall__factory } from "@/lib/contracts";
import { useContract } from "@inaridiy/useful-web3";
import { BigNumber, BytesLike } from "ethers";
import { Interface } from "ethers/lib/utils";
import { useMemo } from "react";
import { useQuery } from "react-query";
import { useCurrentChain } from "./useCurrentChain";

type MethodArg = string | number | BigNumber;
type MethodArgs = Array<MethodArg | MethodArg[]>;

export type Call = {
  target: string;
  callData: BytesLike;
};

export type QueryOption = Partial<{
  enabled: boolean;
}>;

export const useMultiCallContract = () => {
  const {
    name,
    perm: { rpcUrls },
  } = useCurrentChain();
  const contract = useContract(
    (provider) =>
      MultiCall__factory.connect(multiCallAddresses[name], provider),
    { fetchOnly: true, fallbackRpc: rpcUrls[0] as string }
  );

  return contract as MultiCall;
};

export const useMultiCall = (
  key: string,
  calldataList: Call[],
  option?: QueryOption
) => {
  const contract = useMultiCallContract();

  const query = useQuery(
    key,
    () => {
      const promise = contract?.callStatic.aggregate(calldataList);
      //  void promise?.then(e => console.log(calldataList.length, e.returnData));
      return promise;
    },
    option
  );

  return query;
};

export const useMultipleContractData = <T>(
  key: string,
  addresses: string[],
  contractInterface: Interface,
  method: string,
  methodArgs: MethodArgs,
  option?: QueryOption
) => {
  const fragment = useMemo(
    () => contractInterface.getFunction(method),
    [contractInterface]
  );

  const callData = useMemo(
    () =>
      fragment
        ? contractInterface.encodeFunctionData(fragment, methodArgs)
        : undefined,
    [fragment, methodArgs, contractInterface]
  );

  const calls = useMemo(
    () =>
      fragment && addresses && addresses.length > 0 && callData
        ? addresses.map((address) => ({ target: address, callData }))
        : [],
    [fragment, addresses, callData]
  );

  const { data: responses, ...queryState } = useMultiCall(key, calls, option);
  const results = useMemo(
    () =>
      responses?.[1].map((res) =>
        contractInterface.decodeFunctionResult(fragment, res)
      ),
    [responses, fragment, contractInterface]
  );
  return { results, ...queryState };
};
