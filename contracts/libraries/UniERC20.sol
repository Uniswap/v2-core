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

    function eq(IERC20 tokenA, IERC20 tokenB) internal pure returns (bool) {
        return (isETH(tokenA) && isETH(tokenB)) || (tokenA == tokenB);
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
            (bool success, ) = target.call{value: amount}("");
            require(success, "UniERC20: failed to transfer eth to target");
            if (msg.value > amount) {
                // Return remainder if exist
                (success, ) = msg.sender.call{value: msg.value - amount}("");
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
        if (!success) {
            (success, data) = address(token).staticcall{gas: 20000}(
                abi.encodeWithSignature("DECIMALS()")
            );
        }

        return success ? abi.decode(data, (uint8)) : 18;
    }

    function uniSymbol(IERC20 token) internal view returns (string memory) {
        if (isETH(token)) {
            return "ETH";
        }

        (bool success, bytes memory data) = address(token).staticcall{gas: 20000}(
            abi.encodeWithSignature("symbol()")
        );
        if (!success) {
            (success, data) = address(token).staticcall{gas: 20000}(
                abi.encodeWithSignature("SYMBOL()")
            );
        }

        if (success && data.length >= 96) {
            (uint256 offset, uint256 len) = abi.decode(data, (uint256, uint256));
            if (offset == 0x20 && len > 0 && len <= 256) {
                return string(abi.decode(data, (bytes)));
            }
        }

        if (success && data.length == 32) {
            uint256 len = 0;
            while (len < data.length && data[len] >= 0x20 && data[len] <= 0x7E) {
                len++;
            }

            if (len > 0) {
                bytes memory result = new bytes(len);
                for (uint256 i = 0; i < len; i++) {
                    result[i] = data[i];
                }
                return string(result);
            }
        }

        return _toHex(address(token));
    }

    function _toHex(address account) private pure returns (string memory) {
        return _toHex(abi.encodePacked(account));
    }

    function _toHex(bytes memory data) private pure returns (string memory) {
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        uint256 j = 2;
        for (uint256 i = 0; i < data.length; i++) {
            uint256 a = uint8(data[i]) >> 4;
            uint256 b = uint8(data[i]) & 0x0f;
            str[j++] = bytes1(uint8(a + 48 + (a / 10) * 39));
            str[j++] = bytes1(uint8(b + 48 + (b / 10) * 39));
        }

        return string(str);
    }
}
