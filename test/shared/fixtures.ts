import { Contract, Wallet } from 'ethers'
import { deployContract, Fixture, MockProvider } from 'ethereum-waffle'

import { expandTo18Decimals } from './utilities'

import ERC20 from '../../build/ERC20.json'
import WETH9 from '../../build/WETH9.json'
import DeliciouswapFactory from '../../build/DeliciouswapFactory.json'
import DeliciouswapPair from '../../build/DeliciouswapPair.json'
import IDeliciouswapPair from '../../build/IDeliciouswapPair.json'
import DeliciouswapRouter from '../../build/DeliciouswapRouter.json'
import RouterEventEmitter from '../../build/RouterEventEmitter.json'

const overrides = {
  gasLimit: 9999999
}

interface FactoryFixture {
  factory: Contract
}

export const factoryFixture: Fixture<FactoryFixture>  = async function ([wallet]: Wallet[], provider: MockProvider) {
  const factory = await deployContract(wallet, DeliciouswapFactory, [wallet.address], overrides)
  return { factory }
}

interface PairFixture extends FactoryFixture {
  token0: Contract
  token1: Contract
  pair: Contract
}

export const pairFixture: Fixture<PairFixture> = async function ([wallet]: Wallet[], provider: MockProvider) {
  const { factory } = await factoryFixture([wallet], provider)

  const tokenA = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)], overrides)
  const tokenB = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)], overrides)

  await factory.createPair(tokenA.address, tokenB.address, overrides)
  const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
  const pair = new Contract(pairAddress, JSON.stringify(DeliciouswapPair.abi), provider).connect(wallet)

  const token0Address = (await pair.token0()).address
  const token0 = tokenA.address === token0Address ? tokenA : tokenB
  const token1 = tokenA.address === token0Address ? tokenB : tokenA

  return { factory, token0, token1, pair }
}

interface DspFixture {
  token0: Contract
  token1: Contract
  WETH: Contract
  WETHPartner: Contract
  factory: Contract
  routerEventEmitter: Contract
  router: Contract
  pair: Contract
  WETHPair: Contract
}

export const dspFixture: Fixture<DspFixture> = async function ([wallet]: Wallet[], provider: MockProvider) {
  // deploy tokens
  const tokenA = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)])
  const tokenB = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)])
  const WETH = await deployContract(wallet, WETH9)
  const WETHPartner = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)])

  // deploy V2
  const factory = await deployContract(wallet, DeliciouswapFactory, [wallet.address])

  // deploy routers
  const router = await deployContract(wallet, DeliciouswapRouter, [factory.address, WETH.address], overrides)

  // event emitter for testing
  const routerEventEmitter = await deployContract(wallet, RouterEventEmitter, [])

  // initialize V2
  await factory.createPair(tokenA.address, tokenB.address)
  const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
  const pair = new Contract(pairAddress, JSON.stringify(IDeliciouswapPair.abi), provider).connect(wallet)

  const token0Address = await pair.token0()
  const token0 = tokenA.address === token0Address ? tokenA : tokenB
  const token1 = tokenA.address === token0Address ? tokenB : tokenA

  await factory.createPair(WETH.address, WETHPartner.address)
  const WETHPairAddress = await factory.getPair(WETH.address, WETHPartner.address)
  const WETHPair = new Contract(WETHPairAddress, JSON.stringify(IDeliciouswapPair.abi), provider).connect(wallet)

  return {
    token0,
    token1,
    WETH,
    WETHPartner,
    factory,
    router, // the default router, 01 had a minor bug
    routerEventEmitter,
    pair,
    WETHPair
  }
}
