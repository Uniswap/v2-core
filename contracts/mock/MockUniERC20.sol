// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "../libraries/UniERC20.sol";

contract MockUniERC20 {
    using UniERC20 for IERC20;

    function testTransferFromSender(
        IERC20 token,
        address to,
        uint256 amount
    ) external payable {
        token.uniTransferFromSender(to, amount);
    }

    function testTransfer(
        IERC20 token,
        address to,
        uint256 amount
    ) external payable {
        token.uniTransfer(to, amount);
    }

    function testApprove(
        IERC20 token,
        address to,
        uint256 amount
    ) external {
        token.uniApprove(to, amount);
    }

    receive() external payable {}
}
