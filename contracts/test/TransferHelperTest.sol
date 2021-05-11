// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.6.0;

import '../libraries/TransferHelper.sol';

// test helper for transfers
contract TransferHelperTest {
    function safeApprove(
        address token,
        address to,
        uint256 value
    ) external {
        TransferHelper.safeApprove(token, to, value);
    }

    function safeTransfer(
        address token,
        address to,
        uint256 value
    ) external {
        TransferHelper.safeTransfer(token, to, value);
    }

    function safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 value
    ) external {
        TransferHelper.safeTransferFrom(token, from, to, value);
    }

    function safeTransferETH(address to, uint256 value) external {
        TransferHelper.safeTransferETH(to, value);
    }
}

// can revert on failure and returns true if successful
contract TransferHelperTestFakeERC20Compliant {
    bool public success;
    bool public shouldRevert;

    function setup(bool success_, bool shouldRevert_) external {
        success = success_;
        shouldRevert = shouldRevert_;
    }

    function transfer(address, uint256) external view returns (bool) {
        require(!shouldRevert, 'REVERT');
        return success;
    }

    function transferFrom(
        address,
        address,
        uint256
    ) external view returns (bool) {
        require(!shouldRevert, 'REVERT');
        return success;
    }

    function approve(address, uint256) external view returns (bool) {
        require(!shouldRevert, 'REVERT');
        return success;
    }
}

// only reverts on failure, no return value
contract TransferHelperTestFakeERC20Noncompliant {
    bool public shouldRevert;

    function setup(bool shouldRevert_) external {
        shouldRevert = shouldRevert_;
    }

    function transfer(address, uint256) external view {
        require(!shouldRevert);
    }

    function transferFrom(
        address,
        address,
        uint256
    ) external view {
        require(!shouldRevert);
    }

    function approve(address, uint256) external view {
        require(!shouldRevert);
    }
}

contract TransferHelperTestFakeFallback {
    bool public shouldRevert;

    function setup(bool shouldRevert_) external {
        shouldRevert = shouldRevert_;
    }

    receive() external payable {
        require(!shouldRevert);
    }

    function withdraw() external {
        msg.sender.transfer(address(this).balance);
    }
}
