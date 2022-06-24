import { chainTokens } from "@/constants/tokens";
import { useCurrentChain, useMultiCall } from "@/hooks";
import { TokenPair__factory } from "@/lib/contracts";
import { Pair, Token, TokenAmount } from "@penta-swap/sdk";
import { BigNumber } from "ethers";
import { useMemo } from "react";

export const usePairs = (tokenPairs: [Token, Token][]) => {
  const _interface = useMemo(() => TokenPair__factory.createInterface(), []);
  const callDataList = tokenPairs.map(([token1, token2]) => ({
    target: Pair.getAddress(token1, token2),
    callData: _interface.encodeFunctionData("getReserves", [])
  }));
  const resultQuery = useMultiCall(callDataList);

  const { data } = resultQuery;

  const pairs = useMemo(
    () =>
      data?.[1]
        ?.map(
          (result, i) => [tokenPairs[i], result] as [[Token, Token], string]
        )
        .filter(([, e]) => e !== "0x")
        .map(([[tokenA, tokenB], result]) => {
          const [reserves0, reserves1] = _interface.decodeFunctionResult(
            "getReserves",
            result
          ) as [BigNumber, BigNumber];
          const balances = (tokenA.sortsBefore(tokenB)
            ? [reserves0, reserves1]
            : [reserves1, reserves0]) as [BigNumber, BigNumber];
          return new Pair(
            new TokenAmount(tokenA, balances[0].toString()),
            new TokenAmount(tokenB, balances[1].toString())
          );
        }) || [],
    [resultQuery]
  );

  return { ...resultQuery, pairs };
};

export const useRelationPairs = (
  token1?: Token | null,
  token2?: Token | null
) => {
  const { name } = useCurrentChain();

  const commonTokens: Token[] = useMemo(() => {
    return name && name in chainTokens
      ? chainTokens[name as keyof typeof chainTokens]
      : [];
  }, [name, token1, token2]);

  const basePairs = useMemo(
    () =>
      commonTokens
        .map(base =>
          commonTokens
            .filter(other => other !== base)
            .map(other => [base, other])
        )
        .flat(1) as [Token, Token][],
    [commonTokens]
  );
  const allRelationTokenPairs = useMemo(
    () =>
      token1 && token2
        ? [
            [token1, token2],
            ...commonTokens.map(common => [token1, common]),
            ...commonTokens.map(common => [token2, common]),
            ...basePairs
          ]
            .filter((tokens): tokens is [Token, Token] =>
              Boolean(tokens[0] && tokens[1])
            )
            .filter(tokens => tokens[0].address !== tokens[1].address)
        : [],
    [token1, token2, commonTokens, basePairs]
  );

  const allPairs = usePairs(allRelationTokenPairs);
  return allPairs;
};
