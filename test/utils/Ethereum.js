const ethers = require('ethers')

function UInt256Max() {
  return ethers.constants.MaxUint256
}

function address(n) {
  return `0x${n.toString(16).padStart(40, '0')}`
}

function encodeParameters(types, values) {
  const abi = new ethers.utils.AbiCoder()
  return abi.encode(types, values)
}

async function etherBalance(addr) {
  return ethers.BigNumber.from(await ethers.provider.getBalance(addr))
}

async function etherGasCost(receipt) {
  const tx = await ethers.provider.getTransaction(receipt.transactionHash)
  const gasUsed = ethers.BigNumber.from(receipt.gasUsed)
  const gasPrice = ethers.BigNumber.from(tx.gasPrice)
  return gasUsed.times(gasPrice)
}

function etherExp(num) {
  return etherMantissa(num, 1e18)
}

function etherDouble(num) {
  return etherMantissa(num, 1e36)
}

function etherMantissa(num, scale = 1e18) {
  if (num < 0)
    return ethers.BigNumber.from(2)
      .pow(256)
      .plus(num)
  return ethers.BigNumber.from(num).mul(scale)
}

function etherUnsigned(num) {
  return ethers.BigNumber.from(num)
}

function getContractDefaults() {
  return { gas: 20000000, gasPrice: 20000 }
}

function keccak256(values) {
  return ethers.utils.keccak256(values)
}

async function mineBlockNumber(blockNumber) {
  return rpc({ method: 'evm_mineBlockNumber', params: [blockNumber] })
}

async function mineBlock() {
  return rpc({ method: 'evm_mine' })
}

async function increaseTime(seconds) {
  await rpc({ method: 'evm_increaseTime', params: [seconds] })
  return rpc({ method: 'evm_mine' })
}

async function setTime(seconds) {
  await rpc({ method: 'evm_setTime', params: [new Date(seconds * 1000)] })
}

async function freezeTime(seconds) {
  await rpc({ method: 'evm_freezeTime', params: [seconds] })
  return rpc({ method: 'evm_mine' })
}

async function advanceBlocks(blocks) {
  let { result: num } = await rpc({ method: 'eth_blockNumber' })
  await rpc({ method: 'evm_mineBlockNumber', params: [blocks + parseInt(num)] })
}

async function blockNumber() {
  let { result: num } = await rpc({ method: 'eth_blockNumber' })
  return parseInt(num)
}

async function minerStart() {
  return rpc({ method: 'miner_start' })
}

async function minerStop() {
  return rpc({ method: 'miner_stop' })
}

async function rpc(request) {
  return new Promise((okay, fail) => ethers.provider.call(request, (err, res) => (err ? fail(err) : okay(res))))
}

async function both(contract, method, args = [], opts = {}) {
  const reply = await call(contract, method, args, opts)
  const receipt = await send(contract, method, args, opts)
  return { reply, receipt }
}

async function sendFallback(contract, opts = {}) {
  const receipt = await ethers.provider.sendTransaction({
    to: contract._address,
    ...Object.assign(getContractDefaults(), opts)
  })
  return Object.assign(receipt, { events: receipt.logs })
}

module.exports = {
  address,
  encodeParameters,
  etherBalance,
  etherGasCost,
  etherExp,
  etherDouble,
  etherMantissa,
  etherUnsigned,
  keccak256,

  advanceBlocks,
  blockNumber,
  freezeTime,
  increaseTime,
  mineBlock,
  mineBlockNumber,
  minerStart,
  minerStop,
  rpc,
  setTime,

  both,
  sendFallback,
  UInt256Max
}
