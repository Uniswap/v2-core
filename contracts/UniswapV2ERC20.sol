// UniswapV2ERC20.sol

// Specifies the exact compiler version used by Uniswap V2 contracts for reliability.
pragma solidity =0.5.16;

import './interfaces/IUniswapV2ERC20.sol';
import './libraries/SafeMath.sol';

/**
 * @title UniswapV2ERC20
 * @notice Standard ERC-20 implementation with EIP-2612 (Permit) functionality.
 * This contract is used for the Liquidity Provider (LP) tokens.
 */
contract UniswapV2ERC20 is IUniswapV2ERC20 {
    using SafeMath for uint;

    // --- ERC-20 Constants ---
    string public constant name = 'Uniswap V2';
    string public constant symbol = 'UNI-V2';
    uint8 public constant decimals = 18;

    // --- State Variables ---
    uint public totalSupply;
    mapping(address => uint) public balanceOf;
    mapping(address => mapping(address => uint)) public allowance;

    // --- EIP-712 Permit Variables ---
    // The EIP-712 domain separator used to prevent replay attacks across different domains/chains.
    bytes32 public DOMAIN_SEPARATOR; 
    // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    bytes32 public constant PERMIT_TYPEHASH = 0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;
    // Nonce map to track permit calls and prevent signature replay attacks.
    mapping(address => uint) public nonces; 

    // --- Events (Standard ERC-20) ---
    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    /**
     * @notice Initializes the EIP-712 DOMAIN_SEPARATOR in the constructor.
     * @dev Uses assembly to fetch the current chain ID, essential for EIP-712 security.
     */
    constructor() public {
        uint chainId;
        // Fetch chainId using assembly (required for Solidity < 0.8)
        assembly {
            chainId := chainid
        }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
                keccak256(bytes(name)),
                keccak256(bytes('1')), // Version is '1'
                chainId,
                address(this)
            )
        );
    }

    // --- Internal/Private Helper Functions ---

    /**
     * @notice Internal function to mint tokens.
     * @dev Should only be called by the `UniswapV2Pair` contract when liquidity is added.
     * @param to The recipient of the minted tokens.
     * @param value The amount of tokens to mint.
     */
    function _mint(address to, uint value) internal {
        totalSupply = totalSupply.add(value);
        balanceOf[to] = balanceOf[to].add(value);
        emit Transfer(address(0), to, value); // Transfer from zero address indicates minting
    }

    /**
     * @notice Internal function to burn tokens.
     * @dev Should only be called by the `UniswapV2Pair` contract when liquidity is removed.
     * @param from The address from which tokens are burned.
     * @param value The amount of tokens to burn.
     */
    function _burn(address from, uint value) internal {
        balanceOf[from] = balanceOf[from].sub(value);
        totalSupply = totalSupply.sub(value);
        emit Transfer(from, address(0), value); // Transfer to zero address indicates burning
    }

    /**
     * @notice Private helper function for setting token allowance.
     */
    function _approve(address owner, address spender, uint value) private {
        allowance[owner][spender] = value;
        emit Approval(owner, spender, value);
    }

    /**
     * @notice Private helper function for internal token transfers.
     */
    function _transfer(address from, address to, uint value) private {
        balanceOf[from] = balanceOf[from].sub(value);
        balanceOf[to] = balanceOf[to].add(value);
        emit Transfer(from, to, value);
    }

    // --- External ERC-20 Functions ---

    /**
     * @notice Allows a spender to withdraw up to `value` tokens from the caller's account.
     * @param spender The address to be approved.
     * @param value The amount of tokens to approve.
     * @return true always.
     */
    function approve(address spender, uint value) external returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }

    /**
     * @notice Moves `value` tokens from the caller's account to `to`.
     * @param to The recipient address.
     * @param value The amount of tokens to transfer.
     * @return true always.
     */
    function transfer(address to, uint value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    /**
     * @notice Moves `value` tokens from `from` to `to` using the allowance mechanism.
     * @dev Optimized to skip allowance reduction if the allowance is max (uint(-1)).
     * @param from The sender address.
     * @param to The recipient address.
     * @param value The amount of tokens to transfer.
     * @return true always.
     */
    function transferFrom(address from, address to, uint value) external returns (bool) {
        if (allowance[from][msg.sender] != uint(-1)) {
            // Decrease allowance if not infinite approval
            allowance[from][msg.sender] = allowance[from][msg.sender].sub(value);
        }
        _transfer(from, to, value);
        return true;
    }

    // --- EIP-2612 Permit Function ---

    /**
     * @notice Allows the owner to approve a spender via a signed message, saving gas.
     * @param owner The address whose tokens will be approved.
     * @param spender The address to be approved.
     * @param value The amount to approve.
     * @param deadline The time after which the permit signature is invalid.
     * @param v ECDSA signature recovery parameter.
     * @param r ECDSA signature output parameter.
     * @param s ECDSA signature output parameter.
     */
    function permit(
        address owner,
        address spender,
        uint value,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(deadline >= block.timestamp, 'UniswapV2: EXPIRED'); // Signature must not be expired

        // EIP-712 construction: hash('\x19\x01' + DOMAIN_SEPARATOR + hash(typed_data))
        bytes32 digest = keccak256(
            abi.encodePacked(
                '\x19\x01',
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        PERMIT_TYPEHASH,
                        owner,
                        spender,
                        value,
                        nonces[owner]++, // Increment nonce to invalidate signature immediately after use
                        deadline
                    )
                )
            )
        );

        // Recover the address from the signature
        address recoveredAddress = ecrecover(digest, v, r, s);
        
        // Ensure signature is valid and belongs to the owner
        require(recoveredAddress != address(0) && recoveredAddress == owner, 'UniswapV2: INVALID_SIGNATURE');
        
        // Execute the approval
        _approve(owner, spender, value);
    }
}
