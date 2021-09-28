const { ethers } = require('hardhat')
const { getAddress, keccak256, defaultAbiCoder, toUtf8Bytes, solidityPack } = ethers.utils
const HARDHAT_DEFAULT_CHAIN_ID = 31337

const PERMIT_TYPEHASH = keccak256(
  toUtf8Bytes('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')
)

function expandTo18Decimals(n) {
  return ethers.BigNumber.from(n).mul(ethers.BigNumber.from(10).pow(18))
}

function getDomainSeparator(name, tokenAddress) {
  return keccak256(
    defaultAbiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        keccak256(toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')),
        keccak256(toUtf8Bytes(name)),
        keccak256(toUtf8Bytes('1')),
        HARDHAT_DEFAULT_CHAIN_ID,
        tokenAddress
      ]
    )
  )
}

function getCreate2Address(factoryAddress, tokenA, tokenB, bytecode) {
  const [token0, token1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA]
  const create2Inputs = [
    '0xff',
    factoryAddress,
    keccak256(solidityPack(['address', 'address'], [token0, token1])),
    keccak256(bytecode)
  ]
  const sanitizedInputs = `0x${create2Inputs.map(i => i.slice(2)).join('')}`
  return getAddress(`0x${keccak256(sanitizedInputs).slice(-40)}`)
}

async function getApprovalDigest(token, approve, nonce, deadline) {
  const name = await token.name()
  const DOMAIN_SEPARATOR = getDomainSeparator(name, token.address)
  return keccak256(
    solidityPack(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      [
        '0x19',
        '0x01',
        DOMAIN_SEPARATOR,
        keccak256(
          defaultAbiCoder.encode(
            ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
            [PERMIT_TYPEHASH, approve.owner, approve.spender, approve.value, nonce, deadline]
          )
        )
      ]
    )
  )
}

async function mineBlock(provider, timestamp) {
  await new Promise(async (resolve, reject) => {
    provider._web3Provider.sendAsync({ jsonrpc: '2.0', method: 'evm_mine', params: [timestamp] }, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

function encodePrice(reserve0, reserve1) {
  return [
    reserve1.mul(ethers.BigNumber.from(2).pow(112)).div(reserve0),
    reserve0.mul(ethers.BigNumber.from(2).pow(112)).div(reserve1)
  ]
}

module.exports = {
  expandTo18Decimals,
  getDomainSeparator,
  getCreate2Address,
  getApprovalDigest,
  mineBlock,
  encodePrice
}
