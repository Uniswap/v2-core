// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import "../DMMPool.sol";

/// @dev this is a mock contract, so tester can set fee to random value
contract MockDMMPool is DMMPool {
    uint256 public simulationFee;

    constructor(
        address _factory,
        IERC20 _token0,
        IERC20 _token1,
        bool isAmpPool
    ) public DMMPool() {
        factory = IDMMFactory(_factory);
        token0 = _token0;
        token1 = _token1;
        ampBps = isAmpPool ? uint32(BPS + 1) : uint32(BPS);
    }

    function setFee(uint256 _fee) external {
        simulationFee = _fee;
    }

    function setReserves(
        uint112 _reserve0,
        uint112 _reserve1,
        uint112 _vReserve0,
        uint112 _vReserve1
    ) external {
        reserve0 = _reserve0;
        reserve1 = _reserve1;
        vReserve0 = _vReserve0;
        vReserve1 = _vReserve1;
    }

    function verifyBalanceAndUpdateEma(
        uint256 amount0In,
        uint256 amount1In,
        uint256 beforeReserve0,
        uint256 beforeReserve1,
        uint256 afterReserve0,
        uint256 afterReserve1
    ) internal override returns (uint256 feeInPrecision) {
        feeInPrecision = simulationFee;
        //verify balance update is match with fomula
        uint256 balance0Adjusted = afterReserve0.mul(PRECISION);
        balance0Adjusted = balance0Adjusted.sub(amount0In.mul(feeInPrecision));
        balance0Adjusted = balance0Adjusted / PRECISION;
        uint256 balance1Adjusted = afterReserve1.mul(PRECISION);
        balance1Adjusted = balance1Adjusted.sub(amount1In.mul(feeInPrecision));
        balance1Adjusted = balance1Adjusted / PRECISION;
        require(
            balance0Adjusted.mul(balance1Adjusted) >= beforeReserve0.mul(beforeReserve1),
            "DMM: K"
        );
    }
}
