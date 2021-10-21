require('colors')
const fetch = require('node-fetch')
const BigNumber = require('bignumber.js')

const { createWeb3, createQueryString, etherToWei, waitForTxSuccess, weiToEther } = require('./utils')

// https://0x.org/docs/api#introduction
const API_QUOTE_URL = 'https://ropsten.api.0x.org/swap/v1/quote'
const { abi: ABI } = require('../../artifacts/contracts/utility/AMMUtility.sol/AMMUtility.json')

const deployedAddress = '0x865aE37d0739e2B08Dd6A2394b36557166837535'

async function run(sellToken = 'ETH', buyToken = 'DAI', sellAmount = 1000000000) {
  const web3 = createWeb3()
  const contract = new web3.eth.Contract(ABI, deployedAddress)
  const [owner] = await web3.eth.getAccounts()

  console.info(`Fetching swap quote from 0x-API to sell ${sellAmount} ${sellToken} for ${buyToken}...`)
  const qs = createQueryString({
    sellToken,
    buyToken,
    sellAmount
  })

  const quoteUrl = `${API_QUOTE_URL}?${qs}`
  console.info(`Fetching quote ${quoteUrl}...`)

  const response = await fetch(quoteUrl)
  const quote = await response.json()
  console.info(`Received a quote with price ${quote.price}`)

  console.info(`Swapping tokens through the contract at ${deployedAddress}...`)
  const fees = await contract.methods.fee().call()

  const receipt = await waitForTxSuccess(
    contract.methods
      .swapTokens(
        quote.sellTokenAddress,
        quote.buyTokenAddress,
        quote.allowanceTarget,
        quote.to,
        quote.data,
        quote.sellAmount,
        quote.value
      )
      .send({
        from: owner,
        value: new BigNumber(quote.value).plus(fees),
        gasPrice: quote.gasPrice
      })
  )

  const boughtAmount = weiToEther(receipt.events.TokenSwapExecuted.returnValues.amount)
  console.info(
    `${'✔'.bold.green} Successfully sold ${sellAmount.toString().bold} ${sellToken} for ${
      boughtAmount.bold.green
    } ${buyToken}!`
  )
}

;(async argv => {
  try {
    await run(argv[2], argv[3], argv[4])
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})(process.argv)

// Test command: node test/0x-ropsten-test/externalAMM.js ETH DAI 100000
