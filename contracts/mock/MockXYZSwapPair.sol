pragma solidity 0.6.6;

import "../XYZSwapPair.sol";

/// @dev this is a mock contract, so tester can set fee to random value
contract MockXYZSwapPair is XYZSwapPair {
    uint256 public simulationFee;

    constructor(
        address _factory,
        IERC20 _token0,
        IERC20 _token1
    ) public XYZSwapPair() {
        factory = _factory;
        token0 = _token0;
        token1 = _token1;
    }

    function setFee(uint256 _fee) external {
        simulationFee = _fee;
    }

    function getTradeInfo()
        external
        override
        view
        returns (
            uint112 _reserve0,
            uint112 _reserve1,
            uint256 feeInPrecision
        )
    {
        (_reserve0, _reserve1, ) = getReserves();
        feeInPrecision = simulationFee;
    }

    function verifyBalanceAndUpdateEma(
        uint256 _amount0In,
        uint256 _amount1In,
        uint256 _reserve0,
        uint256 _reserve1,
        uint256 _balance0,
        uint256 _balance1
    ) internal override returns (uint256 fee) {
        fee = simulationFee;
        uint256 balance0Adjusted = (
            _balance0.mul(MathExt.PRECISION).sub(_amount0In.mul(fee)).div(MathExt.PRECISION)
        );
        uint256 balance1Adjusted = (
            _balance1.mul(MathExt.PRECISION).sub(_amount1In.mul(fee)).div(MathExt.PRECISION)
        );
        require(balance0Adjusted.mul(balance1Adjusted) >= _reserve0.mul(_reserve1), "XYZSwap: K");
    }
}
