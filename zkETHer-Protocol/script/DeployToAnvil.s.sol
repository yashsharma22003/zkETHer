// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import "../src/SimpleSandboxClaimIssuer.sol";
import "../src/SimplezkETHerToken.sol";

/**
 * @title DeployToAnvil
 * @notice Simple deployment script for Anvil testnet
 */
contract DeployToAnvil is Script {
    
    // Anvil default private key (account 0)
    uint256 constant ANVIL_PRIVATE_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    
    function run() external {
        vm.startBroadcast(ANVIL_PRIVATE_KEY);
        
        console.log("=== Deploying to Anvil Testnet ===");
        console.log("Deployer:", vm.addr(ANVIL_PRIVATE_KEY));
        
        // Deploy the fixed SimpleSandboxClaimIssuer
        address managementKey = vm.addr(ANVIL_PRIVATE_KEY);
        address sandboxPublicKey = managementKey; // Use same key for simplicity
        
        SimpleSandboxClaimIssuer claimIssuer = new SimpleSandboxClaimIssuer(managementKey, sandboxPublicKey);
        console.log("SimpleSandboxClaimIssuer deployed at:", address(claimIssuer));
        
        // Deploy the SimplezkETHerToken
        SimplezkETHerToken token = new SimplezkETHerToken();
        console.log("SimplezkETHerToken deployed at:", address(token));
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Complete ===");
        console.log("Claim Issuer:", address(claimIssuer));
        console.log("Token:", address(token));
        console.log("Network: Anvil (localhost:8545)");
    }
}

/**
 * @title MockClaimIssuer
 * @notice Simplified claim issuer for testing
 */
contract MockClaimIssuer {
    // Claim topic constants
    uint256 public constant AADHAAR_VERIFIED = 1001;
    uint256 public constant PAN_VERIFIED = 1002;
    uint256 public constant FACE_MATCHED = 1003;
    uint256 public constant ZKETHER_ELIGIBLE = 1004;
    
    // Events
    event ClaimIssued(address indexed identity, uint256 indexed topic, bytes data);
    event OnchainIDCreated(address indexed user, address indexed identity);
    
    // Storage
    mapping(address => address) public userToIdentity; // user -> onchain identity
    mapping(address => mapping(uint256 => bool)) public hasClaim; // identity -> topic -> bool
    
    /**
     * @notice Create OnchainID for user
     */
    function createOnchainID(address user, string memory name) external returns (address) {
        // Use CREATE2 for deterministic address
        bytes32 salt = keccak256(abi.encodePacked(user, name, block.timestamp));
        MockIdentity identity = new MockIdentity{salt: salt}(user);
        
        userToIdentity[user] = address(identity);
        
        emit OnchainIDCreated(user, address(identity));
        return address(identity);
    }
    
    /**
     * @notice Issue claim for identity
     */
    function issueClaim(address identity, uint256 topic, bytes memory data) external {
        hasClaim[identity][topic] = true;
        emit ClaimIssued(identity, topic, data);
    }
    
    /**
     * @notice Batch issue all KYC claims
     */
    function batchIssueClaims(address identity, bytes[] memory claimData) external {
        uint256[] memory topics = new uint256[](4);
        topics[0] = AADHAAR_VERIFIED;
        topics[1] = PAN_VERIFIED;
        topics[2] = FACE_MATCHED;
        topics[3] = ZKETHER_ELIGIBLE;
        
        for (uint256 i = 0; i < topics.length; i++) {
            hasClaim[identity][topics[i]] = true;
            emit ClaimIssued(identity, topics[i], claimData[i]);
        }
    }
    
    /**
     * @notice Check if identity has claim
     */
    function hasValidClaim(address identity, uint256 topic) external view returns (bool) {
        return hasClaim[identity][topic];
    }
    
    /**
     * @notice Check if user is fully verified
     */
    function isFullyVerified(address user) external view returns (bool) {
        address identity = userToIdentity[user];
        if (identity == address(0)) return false;
        
        return hasClaim[identity][AADHAAR_VERIFIED] &&
               hasClaim[identity][PAN_VERIFIED] &&
               hasClaim[identity][FACE_MATCHED] &&
               hasClaim[identity][ZKETHER_ELIGIBLE];
    }
}

/**
 * @title MockIdentity
 * @notice Simple identity contract
 */
contract MockIdentity {
    address public owner;
    
    constructor(address _owner) {
        owner = _owner;
    }
    
    function getOwner() external view returns (address) {
        return owner;
    }
}

/**
 * @title MockzkETHerToken
 * @notice Simplified zkETHer token for testing
 */
contract MockzkETHerToken {
    string public name = "zkETHer Token";
    string public symbol = "zkETH";
    uint8 public decimals = 18;
    
    uint256 public tdsRate = 100; // 1% in basis points
    address public tdsCollector;
    uint256 public totalTDSCollected;
    
    mapping(address => uint256) public balanceOf;
    mapping(bytes32 => bool) public commitments;
    mapping(bytes32 => bool) public nullifierHashes;
    
    event Deposit(address indexed user, uint256 amount, bytes32 commitment);
    event Withdrawal(address indexed user, uint256 amount, bytes32 nullifierHash);
    event TDSDeducted(address indexed user, uint256 grossAmount, uint256 tdsAmount, uint256 netAmount);
    
    constructor() {
        tdsCollector = msg.sender;
    }
    
    /**
     * @notice Deposit ETH and mint zkETH tokens
     */
    function deposit(bytes32 commitment) external payable {
        require(msg.value > 0, "Must deposit ETH");
        require(!commitments[commitment], "Commitment already exists");
        
        uint256 tdsAmount = (msg.value * tdsRate) / 10000;
        uint256 netAmount = msg.value - tdsAmount;
        
        // Transfer TDS to collector
        if (tdsAmount > 0) {
            payable(tdsCollector).transfer(tdsAmount);
            totalTDSCollected += tdsAmount;
            emit TDSDeducted(msg.sender, msg.value, tdsAmount, netAmount);
        }
        
        commitments[commitment] = true;
        balanceOf[msg.sender] += netAmount;
        
        emit Deposit(msg.sender, netAmount, commitment);
    }
    
    /**
     * @notice Withdraw ETH by burning zkETH tokens
     */
    function withdraw(uint256 amount, bytes32 nullifierHash) external {
        require(amount > 0, "Amount must be greater than 0");
        require(!nullifierHashes[nullifierHash], "Nullifier already used");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        
        uint256 tdsAmount = (amount * tdsRate) / 10000;
        uint256 netAmount = amount - tdsAmount;
        
        nullifierHashes[nullifierHash] = true;
        balanceOf[msg.sender] -= amount;
        
        // Transfer net amount to user
        payable(msg.sender).transfer(netAmount);
        
        // Transfer TDS to collector
        if (tdsAmount > 0) {
            payable(tdsCollector).transfer(tdsAmount);
            totalTDSCollected += tdsAmount;
            emit TDSDeducted(msg.sender, amount, tdsAmount, netAmount);
        }
        
        emit Withdrawal(msg.sender, netAmount, nullifierHash);
    }
    
    /**
     * @notice Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Calculate TDS amount
     */
    function calculateTDS(uint256 amount) external view returns (uint256) {
        return (amount * tdsRate) / 10000;
    }
    
    receive() external payable {}
}
