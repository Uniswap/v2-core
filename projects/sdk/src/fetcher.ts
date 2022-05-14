import { Contract } from '@ethersproject/contracts'
import type { BaseProvider } from '@ethersproject/providers'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import invariant from 'tiny-invariant'
import { Pair } from '.'
import ERC20 from './abi/IERC20.json'
import IUniswapPair from './abi/IUniswapV2Pair.json'

export class Fetcher {
  public static async fetchTokenData(chainId: number, address: string, provider: BaseProvider) {
    const contract = new Contract(address, ERC20, provider)
    const [symbol = undefined, name = undefined, decimals = 18] = (await Promise.all([
      contract['symbol'](),
      contract['name'](),
      contract['decimals'](),
    ])) as [string | undefined, string | undefined, number]
    return new Token(chainId, address, decimals, symbol, name)
  }
  public static async fetchPairData(factoryAddress: string, tokenA: Token, tokenB: Token, provider: BaseProvider) {
    invariant(tokenA.chainId === tokenB.chainId, 'CHAIN_ID')
    const address = Pair.getAddress(factoryAddress, tokenA, tokenB)
    const [reserves0, reserves1] = await new Contract(address, IUniswapPair, provider)['getReserves']()
    const [balanceA, balanceB] = tokenA.sortsBefore(tokenB) ? [reserves0, reserves1] : [reserves1, reserves0]
    return new Pair(
      factoryAddress,
      CurrencyAmount.fromRawAmount(tokenA, balanceA),
      CurrencyAmount.fromRawAmount(tokenB, balanceB)
    )
  }
}
