pragma solidity ^0.6.0;

import "../libraries/ERC20Permit.sol";

contract MockERC20Permit is ERC20Permit {
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _version,
        uint256 _totalSupply
    ) public ERC20Permit(_name, _symbol, _version) {
        _mint(msg.sender, _totalSupply);
    }
}
