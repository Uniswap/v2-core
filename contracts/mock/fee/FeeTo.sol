// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "../../interfaces/IDMMPool.sol";
import "./IKyberDao.sol";

contract DaoOperator {
    address public daoOperator;

    constructor(address _daoOperator) public {
        require(_daoOperator != address(0), "daoOperator is 0");
        daoOperator = _daoOperator;
    }

    modifier onlyDaoOperator() {
        require(msg.sender == daoOperator, "only daoOperator");
        _;
    }
}

contract FeeTo is DaoOperator, ReentrancyGuard {
    uint256 internal constant PRECISION = (10**18);

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IKyberDao public immutable kyberDao;

    mapping(uint256 => mapping(IERC20 => uint256)) public rewardsPerEpoch;
    mapping(uint256 => mapping(IERC20 => uint256)) public rewardsPaidPerEpoch;
    // hasClaimedReward[staker][epoch]: true/false if the staker has/hasn't claimed the reward for an epoch
    mapping(address => mapping(uint256 => mapping(IERC20 => bool))) public hasClaimedReward;
    mapping(IERC20 => uint256) public reserves; // total balance in the contract that is for reward and platform fee

    mapping(IERC20 => bool) public allowedToken;
    mapping(IERC20 => uint256) public lastFinalizedEpoch;

    event FeeDistributed(IERC20 indexed token, uint256 indexed epoch, uint256 rewardWei);
    event RewardPaid(
        address indexed staker,
        uint256 indexed epoch,
        IERC20 indexed token,
        uint256 amount
    );
    event SetAllowedToken(IERC20 token, bool isAllowed);

    constructor(IKyberDao _kyberDao, address _daoOperator) public DaoOperator(_daoOperator) {
        require(_kyberDao != IKyberDao(0), "_kyberDao 0");

        kyberDao = _kyberDao;
    }

    function setAllowedToken(IERC20 token, bool isAllowed) external onlyDaoOperator {
        allowedToken[token] = isAllowed;

        emit SetAllowedToken(token, isAllowed);
    }

    function finalize(IERC20 token, uint256 epoch) public {
        if (!allowedToken[token]) {
            return;
        }
        uint256 lastEpoch = kyberDao.getCurrentEpochNumber() - 1;
        // epoch mut be last epoch
        if (epoch != lastEpoch) {
            return;
        }
        // epoch must be not finalized
        if (lastEpoch <= lastFinalizedEpoch[token]) {
            return;
        }
        lastFinalizedEpoch[token] = lastEpoch;
        IDMMPool(address(token)).sync();

        uint256 amount = token.balanceOf(address(this)).sub(reserves[token]);
        if (amount == 0) {
            return;
        }
        rewardsPerEpoch[lastEpoch][token] = rewardsPerEpoch[lastEpoch][token].add(amount);
        reserves[token] = reserves[token].add(amount);
        emit FeeDistributed(token, lastEpoch, amount);
    }

    function burn(IERC20 token) external onlyDaoOperator {
        require(allowedToken[token], "token should be distributed");
        uint256 amount = token.balanceOf(address(this));
        if (amount <= 1) {
            return;
        }
        token.safeTransfer(address(token), amount - 1); // gas saving.
        IDMMPool(address(token)).burn(address(token));
    }

    /// @notice  WARNING When staker address is a contract,
    ///          it should be able to receive claimed reward in ETH whenever anyone calls this function.
    /// @dev not revert if already claimed or reward percentage is 0
    ///      allow writing a wrapper to claim for multiple epochs
    /// @param staker address.
    /// @param epoch for which epoch the staker is claiming the reward
    function claimStakerReward(
        address staker,
        IERC20 token,
        uint256 epoch
    ) external nonReentrant returns (uint256 amountWei) {
        if (hasClaimedReward[staker][epoch][token]) {
            // staker has already claimed reward for the epoch
            return 0;
        }

        // the relative part of the reward the staker is entitled to for the epoch.
        // units Precision: 10 ** 18 = 100%
        // if the epoch is current or in the future, kyberDao will return 0 as result
        uint256 percentageInPrecision = kyberDao.getPastEpochRewardPercentageInPrecision(
            staker,
            epoch
        );
        if (percentageInPrecision == 0) {
            return 0; // not revert, in case a wrapper wants to claim reward for multiple epochs
        }

        finalize(token, epoch);
        require(percentageInPrecision <= PRECISION, "percentage too high");

        // Amount of reward to be sent to staker
        uint256 rewardAllStaker = rewardsPerEpoch[epoch][token];
        amountWei = rewardAllStaker.mul(percentageInPrecision).div(PRECISION);
        {
            uint256 newRewardPaid = rewardsPaidPerEpoch[epoch][token].add(amountWei);
            assert(newRewardPaid <= rewardAllStaker); // redundant check, can't happen
            rewardsPaidPerEpoch[epoch][token] = newRewardPaid;
        }

        reserves[token] = reserves[token].sub(amountWei);
        hasClaimedReward[staker][epoch][token] = true; // SSTORE

        // send reward to staker
        token.safeTransfer(staker, amountWei);

        emit RewardPaid(staker, epoch, token, amountWei);
    }

    function getCurrentEpochNumber() internal view returns (uint256 epoch) {
        IKyberDao _kyberDao = kyberDao;
        if (_kyberDao == IKyberDao(0)) {
            return 0;
        } else {
            return _kyberDao.getCurrentEpochNumber();
        }
    }
}
