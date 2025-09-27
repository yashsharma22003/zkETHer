// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";

/**
 * @title SimpleDeployment
 * @notice Minimal deployment script for Anvil testnet
 */
contract SimpleDeployment is Script {
    
    // Anvil default private key (account 0)
    uint256 constant ANVIL_PRIVATE_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    
    function run() external {
        vm.startBroadcast(ANVIL_PRIVATE_KEY);
        
        console.log("=== Deploying to Anvil Testnet ===");
        console.log("Deployer:", vm.addr(ANVIL_PRIVATE_KEY));
        
        // Deploy simple mock contracts
        SimpleMockClaimIssuer claimIssuer = new SimpleMockClaimIssuer();
        console.log("SimpleMockClaimIssuer deployed at:", address(claimIssuer));
        
        SimpleMockToken token = new SimpleMockToken();
        console.log("SimpleMockToken deployed at:", address(token));
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Complete ===");
        console.log("Claim Issuer:", address(claimIssuer));
        console.log("Token:", address(token));
        console.log("Network: Anvil (localhost:8545)");
    }
}

/**
 * @title SimpleMockClaimIssuer
 * @notice Minimal claim issuer for testing
 */
contract SimpleMockClaimIssuer {
    // Claim topic constants
    uint256 public constant AADHAAR_VERIFIED = 1001;
    uint256 public constant PAN_VERIFIED = 1002;
    uint256 public constant FACE_MATCHED = 1003;
    uint256 public constant ZKETHER_ELIGIBLE = 1004;
    
    // Events
    event ClaimAdded(address indexed identity, uint256 indexed claimType);
    event IdentityCreated(address indexed identity);
    
    // Storage
    mapping(address => address) public userToIdentity;
    mapping(address => mapping(uint256 => bool)) public hasClaim;
    
    function createOnchainID(address user, string memory name) external returns (address) {
        bytes32 salt = keccak256(abi.encodePacked(user, name, block.timestamp));
        address identity = address(uint160(uint256(salt)));
        userToIdentity[user] = identity;
        emit IdentityCreated(identity);
        return identity;
    }
    
    function issueClaim(address identity, uint256 topic, bytes memory data) external {
        hasClaim[identity][topic] = true;
        emit ClaimAdded(identity, topic);
    }
    
    function hasValidClaim(address identity, uint256 topic) external view returns (bool) {
        return hasClaim[identity][topic];
    }
}

/**
 * @title SimpleMockToken
 * @notice Minimal zkETHer token for testing
 */
contract SimpleMockToken {
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
    
    function deposit(bytes32 commitment) external payable {
        require(msg.value > 0, "Must deposit ETH");
        require(!commitments[commitment], "Commitment already exists");
        
        uint256 tdsAmount = (msg.value * tdsRate) / 10000;
        uint256 netAmount = msg.value - tdsAmount;
        
        if (tdsAmount > 0) {
            payable(tdsCollector).transfer(tdsAmount);
            totalTDSCollected += tdsAmount;
            emit TDSDeducted(msg.sender, msg.value, tdsAmount, netAmount);
        }
        
        commitments[commitment] = true;
        balanceOf[msg.sender] += netAmount;
        
        emit Deposit(msg.sender, netAmount, commitment);
    }
    
    function withdraw(uint256 amount, bytes32 nullifierHash) external {
        require(amount > 0, "Amount must be greater than 0");
        require(!nullifierHashes[nullifierHash], "Nullifier already used");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        
        uint256 tdsAmount = (amount * tdsRate) / 10000;
        uint256 netAmount = amount - tdsAmount;
        
        nullifierHashes[nullifierHash] = true;
        balanceOf[msg.sender] -= amount;
        
        payable(msg.sender).transfer(netAmount);
        
        if (tdsAmount > 0) {
            payable(tdsCollector).transfer(tdsAmount);
            totalTDSCollected += tdsAmount;
            emit TDSDeducted(msg.sender, amount, tdsAmount, netAmount);
        }
        
        emit Withdrawal(msg.sender, netAmount, nullifierHash);
    }
    
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function calculateTDS(uint256 amount) external view returns (uint256) {
        return (amount * tdsRate) / 10000;
    }
    
    receive() external payable {}
}
