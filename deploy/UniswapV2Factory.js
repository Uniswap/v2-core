module.exports = async function({ getNamedAccounts, deployments }) {
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  token = await deploy('UniswapV2Factory', {
    from: deployer,
    log: true,
    args:[deployer],
    skipIfAlreadyDeployed: true
  })

  console.log('UniswapV2Factory address:', token.address)
}

module.exports.tags = ['UniswapV2Factory']
