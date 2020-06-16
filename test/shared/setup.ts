import { MockProvider, deployContract as evmDeployContract } from 'ethereum-waffle'
import { createMockProvider, getWallets as ovmGetWallets, deployContract as ovmDeployContract } from '@eth-optimism/rollup-full-node'

const deployContract = (process.env.MODE === 'OVM') ? ovmDeployContract : evmDeployContract

const getProvider = async () => {
	let provider
	if (process.env.MODE === 'OVM') {
		provider = await createMockProvider()
	} else {
		provider = new MockProvider({
	    hardfork: 'istanbul',
	    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
	    gasLimit: 9999999
	 	})
	}
	return provider
}

const getWallets = (provider: any) => {
	if (process.env.MODE === 'OVM') {
		return ovmGetWallets(provider)
	} else {
		return provider.getWallets()
	}
}

export { deployContract, getProvider, getWallets }
