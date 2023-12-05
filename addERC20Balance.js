const UniswapV2ERC20Test = artifacts.require("UniswapV2ERC20Test");

module.exports = async function(callback) {
    try {
        const erc20 = await UniswapV2ERC20Test.deployed();
        const accounts = await web3.eth.getAccounts();

        // Mint tokens to both accounts
        await erc20.mint(accounts[0], web3.utils.toWei('1000', 'ether'));
        await erc20.mint(accounts[1], web3.utils.toWei('500', 'ether'));

        // Check balances after minting
        const balance0 = await erc20.balanceOf(accounts[0]);
        const balance1 = await erc20.balanceOf(accounts[1]);

        console.log(`Balance of account 0 after minting: ${web3.utils.fromWei(balance0, 'ether')} tokens`);
        console.log(`Balance of account 1 after minting: ${web3.utils.fromWei(balance1, 'ether')} tokens`);

        // Rest of the script...

    } catch (error) {
        console.error("Error in script execution ", error);
    }

    callback();
};
