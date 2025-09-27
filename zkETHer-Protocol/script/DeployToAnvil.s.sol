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
