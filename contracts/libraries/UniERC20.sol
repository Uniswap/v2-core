// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

/// source: https://github.com/CryptoManiacsZone/1inchProtocol/blob/591a0b4910567abd2f2fcbbf8b85fa3a089d5650/contracts/libraries/UniERC20.sol
library UniERC20 {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public constant ETH_ADDRESS = IERC20(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);

    function isETH(IERC20 token) internal pure returns (bool) {
        return token == ETH_ADDRESS;
    }

    function uniBalanceOf(IERC20 token, address account) internal view returns (uint256) {
        if (isETH(token)) {
            return account.balance;
        } else {
            return token.balanceOf(account);
        }
    }

    function uniTransfer(
        IERC20 token,
        address to,
        uint256 amount
    ) internal {
        if (amount == 0) {
            return;
        }

        if (isETH(token)) {
            (bool success, ) = to.call{value: amount}("");
            require(success, "UniERC20: failed to transfer eth to target");
        } else {
            token.safeTransfer(to, amount);
        }
    }

    function uniTransferFromSender(
        IERC20 token,
        address target,
        uint256 amount
    ) internal {
        if (amount == 0) {
            return;
        }

        if (isETH(token)) {
            require(msg.value >= amount, "UniERC20: not enough value");
            if (target != address(this)) {
                (bool success, ) = target.call{value: amount}("");
                require(success, "UniERC20: failed to transfer eth to target");
            }
            if (msg.value > amount) {
                // Return remainder if exist
                (bool success, ) = msg.sender.call{value: msg.value - amount}("");
                require(success, "UniERC20: failed to transfer back eth");
            }
        } else {
            token.safeTransferFrom(msg.sender, target, amount);
        }
    }

    function uniApprove(
        IERC20 token,
        address to,
        uint256 amount
    ) internal {
        if (isETH(token)) {
            return;
        }

        if (amount == 0) {
            token.safeApprove(to, 0);
            return;
        }

        uint256 allowance = token.allowance(address(this), to);
        if (allowance < amount) {
            if (allowance > 0) {
                token.safeApprove(to, 0);
            }
            token.safeApprove(to, amount);
        }
    }

    function uniDecimals(IERC20 token) internal view returns (uint256) {
        if (isETH(token)) {
            return 18;
        }

        (bool success, bytes memory data) = address(token).staticcall{gas: 20000}(
            abi.encodeWithSignature("decimals()")
        );
        return success ? abi.decode(data, (uint8)) : 18;
    }
}
