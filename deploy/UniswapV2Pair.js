module.exports = async function({ getNamedAccounts, deployments }) {
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  token = await deploy('UniswapV2Pair', {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true
  })

  console.log('UniswapV2Pair address:', token.address)
}

module.exports.tags = ['UniswapV2Pair']
