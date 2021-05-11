// SPDX-License-Identifier: GPL-3.0

pragma solidity=0.6.12;

import '../interfaces/IDeliciouswapRouter.sol';

contract RouterEventEmitter {
    event Amounts(uint[] amounts);

    receive() external payable {}

    function swapExactTokensForTokens(
        address router,
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external {
        (bool success, bytes memory returnData) = router.delegatecall(abi.encodeWithSelector(
            IDeliciouswapRouter(router).swapExactTokensForTokens.selector, amountIn, amountOutMin, path, to, deadline
        ));
        assert(success);
        emit Amounts(abi.decode(returnData, (uint[])));
    }

    function swapTokensForExactTokens(
        address router,
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external {
        (bool success, bytes memory returnData) = router.delegatecall(abi.encodeWithSelector(
            IDeliciouswapRouter(router).swapTokensForExactTokens.selector, amountOut, amountInMax, path, to, deadline
        ));
        assert(success);
        emit Amounts(abi.decode(returnData, (uint[])));
    }

    function swapExactETHForTokens(
        address router,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable {
        (bool success, bytes memory returnData) = router.delegatecall(abi.encodeWithSelector(
            IDeliciouswapRouter(router).swapExactETHForTokens.selector, amountOutMin, path, to, deadline
        ));
        assert(success);
        emit Amounts(abi.decode(returnData, (uint[])));
    }

    function swapTokensForExactETH(
        address router,
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external {
        (bool success, bytes memory returnData) = router.delegatecall(abi.encodeWithSelector(
            IDeliciouswapRouter(router).swapTokensForExactETH.selector, amountOut, amountInMax, path, to, deadline
        ));
        assert(success);
        emit Amounts(abi.decode(returnData, (uint[])));
    }

    function swapExactTokensForETH(
        address router,
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external {
        (bool success, bytes memory returnData) = router.delegatecall(abi.encodeWithSelector(
            IDeliciouswapRouter(router).swapExactTokensForETH.selector, amountIn, amountOutMin, path, to, deadline
        ));
        assert(success);
        emit Amounts(abi.decode(returnData, (uint[])));
    }

    function swapETHForExactTokens(
        address router,
        uint amountOut,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable {
        (bool success, bytes memory returnData) = router.delegatecall(abi.encodeWithSelector(
            IDeliciouswapRouter(router).swapETHForExactTokens.selector, amountOut, path, to, deadline
        ));
        assert(success);
        emit Amounts(abi.decode(returnData, (uint[])));
    }
}
