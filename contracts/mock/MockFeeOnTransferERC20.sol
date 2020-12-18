pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockFeeOnTransferERC20 is ERC20 {
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply
    ) public ERC20(_name, _symbol) {
        _mint(msg.sender, _totalSupply);
    }

    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal override {
        uint256 burnAmount = (value * 13) / 10000;
        _burn(from, burnAmount);
        uint256 transferAmount = value.sub(burnAmount);

        super._transfer(from, to, transferAmount);
    }
}
