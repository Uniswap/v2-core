// SPDX-License-Identifier: MIT
pragma solidity =0.5.16;

import './libraries/SafeMath.sol';

/**
 * @title Multisignature wallet - Allows multiple parties to agree on
 *   transactions before execution.
 *
 * @author Stefan George - <stefan.george@consensys.net>
 * */
contract MultiSigWallet {
    using SafeMath for uint256;

    /*
     *  Events
     */
    event Confirmation(address indexed sender, uint256 indexed transactionId);
    event Revocation(address indexed sender, uint256 indexed transactionId);
    event Submission(uint256 indexed transactionId);
    event Execution(uint256 indexed transactionId);
    event ExecutionFailure(uint256 indexed transactionId);
    event Deposit(address indexed sender, uint256 value);
    event OwnerAddition(address indexed owner);
    event OwnerRemoval(address indexed owner);
    event RequirementChange(uint256 required);

    /*
     *  Constants
     */
    uint256 public constant MAX_OWNER_COUNT = 50;

    /*
     *  Storage
     */
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    mapping(address => bool) public isOwner;
    address[] public owners;
    uint256 public required;
    uint256 public transactionCount;

    struct Transaction {
        address destination;
        uint256 value;
        bytes data;
        bool executed;
    }

    /*
     *  Modifiers
     */
    modifier onlyWallet() {
        require(msg.sender == address(this), 'MultiSigWallet::onlyWallet: ERR_ONLY_WALLET');
        _;
    }

    modifier ownerDoesNotExist(address owner) {
        require(!isOwner[owner], 'MultiSigWallet::ownerDoesNotExist: ERR_ONWER_DOESNT_EXIST');
        _;
    }

    modifier ownerExists(address owner) {
        require(isOwner[owner], 'MultiSigWallet::ownerExists: ERR_ONWER_EXIST');
        _;
    }

    modifier transactionExists(uint256 transactionId) {
        require(
            transactions[transactionId].destination != address(0),
            'MultiSigWallet::transactionExists: ERR_INVALID_TARGET'
        );
        _;
    }

    modifier confirmed(uint256 transactionId, address owner) {
        require(confirmations[transactionId][owner], 'MultiSigWallet::confirmed: ERR_NOT_CONFIRMED');
        _;
    }

    modifier notConfirmed(uint256 transactionId, address owner) {
        require(!confirmations[transactionId][owner], 'MultiSigWallet::notConfirmed: ERR_CONFIRMED');
        _;
    }

    modifier notExecuted(uint256 transactionId) {
        require(!transactions[transactionId].executed, 'MultiSigWallet::notExecuted: ERR_EXECUTED');
        _;
    }

    modifier notNull(address _address) {
        require(_address != address(0), 'MultiSigWallet::notNull: ERR_ZERO_ADDRESS');
        _;
    }

    modifier validRequirement(uint256 ownerCount, uint256 _required) {
        require(
            ownerCount <= MAX_OWNER_COUNT && _required <= ownerCount && _required != 0 && ownerCount != 0,
            'MultiSigWallet::validRequirement: ERR_INVALID_REQUIREMENT'
        );
        _;
    }

    /// @notice Fallback function allows to deposit ether.
    function() external payable {
        if (msg.value > 0) emit Deposit(msg.sender, msg.value);
    }

    /*
     * Public functions
     */

    /**
     * @notice Contract constructor sets initial owners and required number
     *   of confirmations.
     *
     * @param _owners List of initial owners.
     * @param _required Number of required confirmations.
     * */
    constructor(address[] memory _owners, uint256 _required) public validRequirement(_owners.length, _required) {
        for (uint256 i = 0; i < _owners.length; i++) {
            require(
                !isOwner[_owners[i]] && _owners[i] != address(0),
                'MultiSigWallet::constructor: ERR_INVALID_OWNERS'
            );
            isOwner[_owners[i]] = true;
        }
        owners = _owners;
        required = _required;
    }

    /**
     * @notice Allows to add a new owner. Transaction has to be sent by wallet.
     * @param owner Address of new owner.
     * */
    function addOwner(address owner)
        public
        onlyWallet
        ownerDoesNotExist(owner)
        notNull(owner)
        validRequirement(owners.length + 1, required)
    {
        isOwner[owner] = true;
        owners.push(owner);
        emit OwnerAddition(owner);
    }

    /**
     * @notice Allows to remove an owner. Transaction has to be sent by wallet.
     * @param owner Address of owner.
     * */
    function removeOwner(address owner) public onlyWallet ownerExists(owner) {
        isOwner[owner] = false;

        for (uint256 i = 0; i < owners.length - 1; i++) {
            if (owners[i] == owner) {
                owners[i] = owners[owners.length - 1];
                break;
            }
        }

        owners.pop();

        if (required > owners.length) changeRequirement(owners.length);
        emit OwnerRemoval(owner);
    }

    /**
     * @notice Allows to replace an owner with a new owner. Transaction has
     *   to be sent by wallet.
     *
     * @param owner Address of owner to be replaced.
     * @param newOwner Address of new owner.
     * */
    function replaceOwner(address owner, address newOwner)
        public
        onlyWallet
        ownerExists(owner)
        ownerDoesNotExist(newOwner)
    {
        for (uint256 i = 0; i < owners.length; i++)
            if (owners[i] == owner) {
                owners[i] = newOwner;
                break;
            }
        isOwner[owner] = false;
        isOwner[newOwner] = true;
        emit OwnerRemoval(owner);
        emit OwnerAddition(newOwner);
    }

    /**
     * @notice Allows to change the number of required confirmations.
     * Transaction has to be sent by wallet.
     *
     * @param _required Number of required confirmations.
     * */
    function changeRequirement(uint256 _required) public onlyWallet validRequirement(owners.length, _required) {
        required = _required;
        emit RequirementChange(_required);
    }

    /**
     * @notice Allows an owner to submit and confirm a transaction.
     *
     * @param destination Transaction target address.
     * @param value Transaction ether value.
     * @param data Transaction data payload.
     *
     * @return transactionId Returns transaction ID.
     * */
    function submitTransaction(
        address destination, //contract to interact
        uint256 value,
        bytes memory data //tx.encodeABI
    ) public returns (uint256 transactionId) {
        transactionId = addTransaction(destination, value, data);
        confirmTransaction(transactionId);
    }

    /**
     * @notice Allows an owner to confirm a transaction.
     * @param transactionId Transaction ID.
     * */
    function confirmTransaction(uint256 transactionId)
        public
        ownerExists(msg.sender)
        transactionExists(transactionId)
        notConfirmed(transactionId, msg.sender)
    {
        confirmations[transactionId][msg.sender] = true;
        emit Confirmation(msg.sender, transactionId);
        executeTransaction(transactionId);
    }

    /**
     * @notice Allows an owner to revoke a confirmation for a transaction.
     * @param transactionId Transaction ID.
     * */
    function revokeConfirmation(uint256 transactionId)
        public
        ownerExists(msg.sender)
        confirmed(transactionId, msg.sender)
        notExecuted(transactionId)
    {
        confirmations[transactionId][msg.sender] = false;
        emit Revocation(msg.sender, transactionId);
    }

    /**
     * @notice Allows anyone to execute a confirmed transaction.
     * @param transactionId Transaction ID.
     * */
    function executeTransaction(uint256 transactionId)
        public
        ownerExists(msg.sender)
        confirmed(transactionId, msg.sender)
        notExecuted(transactionId)
    {
        if (isConfirmed(transactionId)) {
            Transaction storage txn = transactions[transactionId];
            txn.executed = true;
            if (external_call(txn.destination, txn.value, txn.data.length, txn.data)) emit Execution(transactionId);
            else {
                emit ExecutionFailure(transactionId);
                txn.executed = false;
            }
        }
    }

    /**
     * @notice Low level transaction execution.
     *
     * @dev Call has been separated into its own function in order to
     *   take advantage of the Solidity's code generator to produce a
     *   loop that copies tx.data into memory.
     *
     * @param destination The address of the Smart Contract to call.
     * @param value The amout of rBTC to send w/ the transaction.
     * @param dataLength The size of the payload.
     * @param data The payload.
     *
     * @return Success or failure.
     * */
    function external_call(
        address destination,
        uint256 value,
        uint256 dataLength,
        bytes memory data
    ) internal returns (bool) {
        bool result;
        assembly {
            let x := mload(0x40) /// "Allocate" memory for output (0x40 is where "free memory" pointer is stored by convention)
            let d := add(data, 32) /// First 32 bytes are the padded length of data, so exclude that
            result := call(
                sub(gas(), 34710), /// 34710 is the value that solidity is currently emitting
                /// It includes callGas (700) + callVeryLow (3, to pay for SUB) + callValueTransferGas (9000) +
                /// callNewAccountGas (25000, in case the destination address does not exist and needs creating)
                destination,
                value,
                d,
                dataLength, /// Size of the input (in bytes) - this is what fixes the padding problem
                x,
                0 /// Output is ignored, therefore the output size is zero
            )
        }
        return result;
    }

    /**
     * @notice Returns the confirmation status of a transaction.
     * @param transactionId Transaction ID.
     * @return Confirmation status.
     * */
    function isConfirmed(uint256 transactionId) public view returns (bool) {
        uint256 count = 0;
        for (uint256 i = 0; i < owners.length; i++) {
            if (confirmations[transactionId][owners[i]]) count = count.add(1);
            if (count == required) return true;
        }

        return false;
    }

    /*
     * Internal functions
     */

    /**
     * @notice Adds a new transaction to the transaction mapping,
     *   if transaction does not exist yet.
     *
     * @param destination Transaction target address.
     * @param value Transaction ether value.
     * @param data Transaction data payload.
     *
     * @return transactionId Returns transaction ID.
     * */
    function addTransaction(
        address destination,
        uint256 value,
        bytes memory data
    ) internal notNull(destination) returns (uint256 transactionId) {
        transactionId = transactionCount;
        transactions[transactionId] = Transaction({
            destination: destination,
            value: value,
            data: data,
            executed: false
        });
        transactionCount = transactionCount.add(1);
        emit Submission(transactionId);
    }

    /*
     * Web3 call functions
     */

    /**
     * @notice Get the number of confirmations of a transaction.
     * @param transactionId Transaction ID.
     * @return count Number of confirmations.
     * */
    function getConfirmationCount(uint256 transactionId) public view returns (uint256 count) {
        for (uint256 i = 0; i < owners.length; i++) if (confirmations[transactionId][owners[i]]) count = count.add(1);
    }

    /**
     * @notice Get the total number of transactions after filers are applied.
     * @param pending Include pending transactions.
     * @param executed Include executed transactions.
     * @return count Total number of transactions after filters are applied.
     * */
    function getTransactionCount(bool pending, bool executed) public view returns (uint256 count) {
        for (uint256 i = 0; i < transactionCount; i++)
            if ((pending && !transactions[i].executed) || (executed && transactions[i].executed)) count = count.add(1);
    }

    /**
     * @notice Get the list of owners.
     * @return List of owner addresses.
     * */
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    /**
     * @notice Get the array with owner addresses, which confirmed transaction.
     * @param transactionId Transaction ID.
     * @return _confirmations Returns array of owner addresses.
     * */
    function getConfirmations(uint256 transactionId) public view returns (address[] memory _confirmations) {
        address[] memory confirmationsTemp = new address[](owners.length);
        uint256 count = 0;
        uint256 i;
        for (i = 0; i < owners.length; i++)
            if (confirmations[transactionId][owners[i]]) {
                confirmationsTemp[count] = owners[i];
                count = count.add(1);
            }
        _confirmations = new address[](count);
        for (i = 0; i < count; i++) _confirmations[i] = confirmationsTemp[i];
    }

    /**
     * @notice Get the list of transaction IDs in defined range.
     *
     * @param from Index start position of transaction array.
     * @param to Index end position of transaction array.
     * @param pending Include pending transactions.
     * @param executed Include executed transactions.
     *
     * @return _transactionIds Returns array of transaction IDs.
     * */
    function getTransactionIds(
        uint256 from,
        uint256 to,
        bool pending,
        bool executed
    ) public view returns (uint256[] memory _transactionIds) {
        uint256[] memory transactionIdsTemp = new uint256[](transactionCount);
        uint256 count = 0;
        uint256 i;
        for (i = 0; i < transactionCount; i++)
            if ((pending && !transactions[i].executed) || (executed && transactions[i].executed)) {
                transactionIdsTemp[count] = i;
                count = count.add(1);
            }
        _transactionIds = new uint256[](to - from);
        for (i = from; i < to; i++) _transactionIds[i - from] = transactionIdsTemp[i];
    }
}
