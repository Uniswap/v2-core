// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.5.0;

import '../libraries/SafeERC20Namer.sol';

// used for testing the logic of token naming
contract SafeERC20NamerTest {
    function tokenSymbol(address token) external view returns (string memory) {
        return SafeERC20Namer.tokenSymbol(token);
    }

    function tokenName(address token) external view returns (string memory) {
        return SafeERC20Namer.tokenName(token);
    }
}

// does not implement name or symbol
contract NamerTestFakeOptionalERC20 {

}

// complies with ERC20 and returns strings
contract NamerTestFakeCompliantERC20 {
    string public name;
    string public symbol;

    constructor(string memory name_, string memory symbol_) public {
        name = name_;
        symbol = symbol_;
    }
}

// implements name and symbol but returns bytes32
contract NamerTestFakeNoncompliantERC20 {
    bytes32 public name;
    bytes32 public symbol;

    constructor(bytes32 name_, bytes32 symbol_) public {
        name = name_;
        symbol = symbol_;
    }
}
