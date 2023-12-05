const UniswapV2ERC20 = artifacts.require("UniswapV2ERC20Test");

module.exports = async function(callback) {
    try {
        // Get deployed contract instance
        const erc20 = await UniswapV2ERC20.deployed();

        // Get accounts
        const accounts = await web3.eth.getAccounts();

        // Display original balances
        let balance0 = await erc20.balanceOf(accounts[0]);
        let balance1 = await erc20.balanceOf(accounts[1]);
        console.log("Original Balance of account 0: ", balance0.toString());
        console.log("Original Balance of account 1: ", balance1.toString());

        // Transfer tokens
        let amount = web3.utils.toWei('10', 'ether'); // for example, transferring 10 tokens
        await erc20.transfer(accounts[1], amount, { from: accounts[0] });

        // Display new balances
        balance0 = await erc20.balanceOf(accounts[0]);
        balance1 = await erc20.balanceOf(accounts[1]);
        console.log("New Balance of account 0: ", balance0.toString());
        console.log("New Balance of account 1: ", balance1.toString());

        // Add more interactions here as needed

    } catch (error) {
        console.error("Error in script execution ", error);
    }

    callback();
};
