import { MockProvider, deployContract as evmDeployContract } from 'ethereum-waffle'
import { addHandlerToProvider, deployContract as ovmDeployContract } from '@eth-optimism/rollup-full-node'

const deployContract = (process.env.MODE === 'OVM') ? ovmDeployContract : evmDeployContract

const getProvider = async () => {
	let provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
    gasLimit: 9999999
 	})
	if (process.env.MODE === 'OVM') {
		provider = await addHandlerToProvider(provider)
	}
	return provider
}

export { deployContract, getProvider }
