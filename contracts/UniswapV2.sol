pragma solidity 0.5.12;

import "./interfaces/IUniswapV2.sol";

import "./libraries/Math.sol";
import "./libraries/SafeMath128.sol";
import "./libraries/UQ104x104.sol";

import "./token/ERC20.sol";
import "./token/SafeTransfer.sol";

contract UniswapV2 is IUniswapV2, ERC20("Uniswap V2", "UNI-V2", 18, 0), SafeTransfer {
    using SafeMath128 for uint128;
    using SafeMath256 for uint256;
    using UQ104x104 for uint240;

    address public factory;
    address public token0;
    address public token1;

    uint128 private reserveToken0;
    uint128 private reserveToken1;

    uint240 private priceAccumulatedToken0;
    uint16 private blockNumberHalf0;

    uint240 private priceAccumulatedToken1;
    uint16 private blockNumberHalf1;

    bool private notEntered = true;
    modifier lock() {
        require(notEntered, "UniswapV2: LOCKED");
        notEntered = false;
        _;
        notEntered = true;
    }

    event LiquidityMinted(
        address indexed sender,
        address indexed recipient,
        uint128 amountToken0,
        uint128 amountToken1,
        uint128 reserveToken0,
        uint128 reserveToken1,
        uint256 liquidity
    );
    event LiquidityBurned(
        address indexed sender,
        address indexed recipient,
        uint128 amountToken0,
        uint128 amountToken1,
        uint128 reserveToken0,
        uint128 reserveToken1,
        uint256 liquidity
    );
    event Swap(
        address indexed sender,
        address indexed recipient,
        uint128 amountToken0,
        uint128 amountToken1,
        uint128 reserveToken0,
        uint128 reserveToken1,
        address input
    );


    constructor() public {
        factory = msg.sender;
    }

    function initialize(address _token0, address _token1) external {
        require(token0 == address(0) && token1 == address(0), 'UniswapV2: ALREADY_INITIALIZED');
        token0 = _token0;
        token1 = _token1;
    }

    function getReserves() external view returns (uint128, uint128) {
        return (reserveToken0, reserveToken1);
    }

    function readOraclePricesAccumulated() external view returns (uint240, uint240) {
        return (priceAccumulatedToken0, priceAccumulatedToken1);
    }

    function readOracleBlockNumber() public view returns (uint32) {
        return (uint32(blockNumberHalf0) << 16) + blockNumberHalf1;
    }

    function consultOracle() external view returns (uint240, uint240) {
        uint32 blockNumberLast = readOracleBlockNumber();

        require(reserveToken0 != 0 && reserveToken1 != 0, "UniswapV2: NO_LIQUIDITY");

        // replicate the logic in update
        if (block.number > blockNumberLast) {
            uint240 priceToken0 = UQ104x104.encode(reserveToken0).qdiv(reserveToken1);
            uint240 priceToken1 = UQ104x104.encode(reserveToken1).qdiv(reserveToken0);

            uint32 blocksElapsed = block.number.downcast32() - blockNumberLast;
            return (
                priceAccumulatedToken0 + priceToken0 * blocksElapsed,
                priceAccumulatedToken1 + priceToken1 * blocksElapsed
            );
        } else {
            return (
                priceAccumulatedToken0,
                priceAccumulatedToken1
            );
        }
    }


    function getAmountOutput(uint128 amountInput, uint128 reserveInput, uint128 reserveOutput)
        public pure returns (uint128 amountOutput)
    {
        require(amountInput > 0 && reserveInput > 0 && reserveOutput > 0, "UniswapV2: INVALID_VALUE");
        uint256 amountInputWithFee = uint256(amountInput).mul(997);
        uint256 numerator = amountInputWithFee.mul(reserveOutput);
        uint256 denominator = uint256(reserveInput).mul(1000).add(amountInputWithFee);
        amountOutput = (numerator / denominator).downcast128();
    }

    function update(uint128 balanceToken0, uint128 balanceToken1) private {
        uint32 blockNumberLast = readOracleBlockNumber();

        // if any blocks have gone by since the last time this function was called, we have to update
        if (block.number > blockNumberLast) {
            // we have to ensure that neither reserves are 0, else our price division fails
            if (reserveToken0 != 0 && reserveToken1 != 0) {
                // get the prices according to the reserves as of the last official interaction with the contract
                uint240 priceToken0 = UQ104x104.encode(reserveToken0).qdiv(reserveToken1);
                uint240 priceToken1 = UQ104x104.encode(reserveToken1).qdiv(reserveToken0);

                // multiply these prices by the number of elapsed blocks and add to the accumulators
                uint32 blocksElapsed = block.number.downcast32() - blockNumberLast;
                priceAccumulatedToken0 += priceToken0 * blocksElapsed;
                priceAccumulatedToken1 += priceToken1 * blocksElapsed;
            }

            // update the last block number
            blockNumberHalf0 = uint16(block.number >> 16);
            blockNumberHalf1 = uint16(block.number);
        }

        // update reserves
        reserveToken0 = balanceToken0;
        reserveToken1 = balanceToken1;
    }

    function mintLiquidity(address recipient) external lock returns (uint256 liquidity) {
        uint128 balanceToken0 = IERC20(token0).balanceOf(address(this)).downcast128();
        uint128 balanceToken1 = IERC20(token1).balanceOf(address(this)).downcast128();
        uint128 amountToken0 = balanceToken0.sub(reserveToken0);
        uint128 amountToken1 = balanceToken1.sub(reserveToken1);

        if (totalSupply == 0) {
            liquidity = Math.sqrt(uint256(amountToken0).mul(amountToken1));
        } else {
            liquidity = Math.min(
                uint256(amountToken0).mul(totalSupply) / reserveToken0,
                uint256(amountToken1).mul(totalSupply) / reserveToken1
            );
        }

        if (liquidity > 0) mint(recipient, liquidity);
        update(balanceToken0, balanceToken1);
        emit LiquidityMinted(
            msg.sender, recipient, amountToken0, amountToken1, balanceToken0, balanceToken1, liquidity
        );
    }

    function burnLiquidity(address recipient) external lock returns (uint128 amountToken0, uint128 amountToken1) {
        uint256 liquidity = balanceOf[address(this)];
        amountToken0 = (liquidity.mul(reserveToken0) / totalSupply).downcast128();
        amountToken1 = (liquidity.mul(reserveToken1) / totalSupply).downcast128();
        if (amountToken0 > 0) safeTransfer(token0, recipient, amountToken0);
        if (amountToken1 > 0) safeTransfer(token1, recipient, amountToken1);
        if (liquidity > 0) _burn(address(this), liquidity);

        uint128 balanceToken0 = IERC20(token0).balanceOf(address(this)).downcast128();
        uint128 balanceToken1 = IERC20(token1).balanceOf(address(this)).downcast128();

        update(balanceToken0, balanceToken1);
        emit LiquidityBurned(
            msg.sender, recipient, amountToken0, amountToken1, balanceToken0, balanceToken1, liquidity
        );
    }

    function rageQuit(address output, address recipient) external lock returns (uint128 amountOutput) {
        uint256 liquidity = balanceOf[address(this)];
        uint128 amount0;
        uint128 amount1;

        if (output == token0) {
            amount0 = amountOutput = (liquidity.mul(reserveToken0) / totalSupply).downcast128();
            safeTransfer(token0, recipient, amount0);
        } else {
            require(output == token1, "UniswapV2: INVALID_OUTPUT");
            amount1 = amountOutput = (liquidity.mul(reserveToken1) / totalSupply).downcast128();
            safeTransfer(token1, recipient, amount1);
        }

        if (liquidity > 0) _burn(address(this), liquidity);

        uint128 balanceToken0 = IERC20(token0).balanceOf(address(this)).downcast128();
        uint128 balanceToken1 = IERC20(token1).balanceOf(address(this)).downcast128();

        update(balanceToken0, balanceToken1);
        emit LiquidityBurned(
            msg.sender, recipient, amount0, amount1, balanceToken0, balanceToken1, liquidity
        );
    }

    function swap(address input, address recipient) external lock returns (uint128 amountOutput) {
        uint128 balanceToken0;
        uint128 balanceToken1;
        uint128 amount0;
        uint128 amount1;

        if (input == token0) {
            balanceToken0 = IERC20(input).balanceOf(address(this)).downcast128();
            amount0 = balanceToken0.sub(reserveToken0);
            amount1 = amountOutput = getAmountOutput(amount0, reserveToken0, reserveToken1);
            safeTransfer(token1, recipient, amount1);
            balanceToken1 = IERC20(token1).balanceOf(address(this)).downcast128();
        } else {
            require(input == token1, "UniswapV2: INVALID_INPUT");
            balanceToken1 = IERC20(input).balanceOf(address(this)).downcast128();
            amount1 = balanceToken1.sub(reserveToken1);
            amount0 = amountOutput = getAmountOutput(amount1, reserveToken1, reserveToken0);
            safeTransfer(token0, recipient, amount0);
            balanceToken0 = IERC20(token0).balanceOf(address(this)).downcast128();
        }

        update(balanceToken0, balanceToken1);
        emit Swap(
            msg.sender, recipient, amount0, amount1, balanceToken0, balanceToken1, input
        );
    }
}
