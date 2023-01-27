module.exports = async function({ getNamedAccounts, deployments }) {
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  token = await deploy('UniswapV2ERC20', {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true
  })

  console.log('UniswapV2ERC20 address:', token.address)
}

module.exports.tags = ['UniswapV2ERC20']
