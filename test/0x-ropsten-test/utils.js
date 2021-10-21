const HDWalletProvider = require('@truffle/hdwallet-provider')
const BigNumber = require('bignumber.js')
const process = require('process')
const Web3 = require('web3')

const MNEMONIC = ''
const RPC_URL = 'https://ropsten.infura.io/v3/<project-id>'

function createQueryString(params) {
  return Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
}

// Wait for a web3 tx `send()` call to be mined and return the receipt.
function waitForTxSuccess(tx) {
  return new Promise((accept, reject) => {
    try {
      tx.on('error', err => reject(err))
      tx.on('receipt', receipt => accept(receipt))
    } catch (err) {
      reject(err)
    }
  })
}

function createProvider() {
  const provider = /^ws?:\/\//.test(RPC_URL)
    ? new Web3.providers.WebsocketProvider(RPC_URL)
    : new Web3.providers.HttpProvider(RPC_URL)

  if (!MNEMONIC) {
    return provider
  }
  return new HDWalletProvider({ mnemonic: MNEMONIC, providerOrUrl: provider })
}

function createWeb3() {
  return new Web3(createProvider())
}

function etherToWei(etherAmount) {
  return new BigNumber(etherAmount)
    .times('1e18')
    .integerValue()
    .toString(10)
}

function weiToEther(weiAmount) {
  return new BigNumber(weiAmount).div('1e18').toString(10)
}

module.exports = {
  etherToWei,
  weiToEther,
  createWeb3,
  createQueryString,
  waitForTxSuccess,
  createProvider
}
