// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SimpleSandboxClaimIssuer} from "../src/SimpleSandboxClaimIssuer.sol";
import {SimplezkETHerToken} from "../src/SimplezkETHerToken.sol";

/**
 * @title DeployProduction
 * @notice Production deployment script for zkETHer-Protocol
 */
contract DeployProduction is Script {
    
    // Configuration - UPDATE THESE FOR YOUR DEPLOYMENT
    address constant MANAGEMENT_KEY = 0x742D35CC6634C0532925a3b8D4c8C8b4c8c8b4C8; // Replace with your management address
    address constant SANDBOX_PUBLIC_KEY = 0x1234567890123456789012345678901234567890; // Replace with Sandbox API public key
    address constant TDS_COLLECTOR = 0xABcdEFABcdEFabcdEfAbCdefabcdeFABcDEFabCD; // Replace with TDS collector address
    
    // Deployed contract addresses (will be set during deployment)
    SimpleSandboxClaimIssuer public claimIssuer;
    SimplezkETHerToken public token;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("=== zkETHer-Protocol Production Deployment ===");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Management Key:", MANAGEMENT_KEY);
        console.log("Sandbox Key:", SANDBOX_PUBLIC_KEY);
        console.log("TDS Collector:", TDS_COLLECTOR);
        
        // Deploy SimpleSandboxClaimIssuer
        console.log("\n1. Deploying SimpleSandboxClaimIssuer...");
        claimIssuer = new SimpleSandboxClaimIssuer(MANAGEMENT_KEY, SANDBOX_PUBLIC_KEY);
        console.log("SimpleSandboxClaimIssuer deployed at:", address(claimIssuer));
        
        // Verify claim issuer deployment
        require(claimIssuer.AADHAAR_VERIFIED() == 1001, "Claim issuer deployment failed");
        require(claimIssuer.sandboxPublicKey() == SANDBOX_PUBLIC_KEY, "Sandbox key not set correctly");
        console.log("Claim issuer verification: PASSED");
        
        // Deploy SimplezkETHerToken
        console.log("\n2. Deploying SimplezkETHerToken...");
        token = new SimplezkETHerToken();
        console.log("SimplezkETHerToken deployed at:", address(token));
        
        // Initialize token with defaults (Note: You'll need proper ERC-3643 infrastructure for production)
        console.log("\n3. Token ready for initialization");
        console.log("   Option 1 - Use defaults: token.initializeWithDefaults(identityRegistry, compliance, onchainID, tdsCollector)");
        console.log("   Option 2 - Custom config: token.initialize(identityRegistry, compliance, name, symbol, decimals, onchainID, tdsCollector)");
        console.log("   Default configuration: Name='zkETHer Token', Symbol='zkETH', Decimals=18");
        
        vm.stopBroadcast();
        
        // Output deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("SimpleSandboxClaimIssuer:", address(claimIssuer));
        console.log("SimplezkETHerToken:", address(token));
        console.log("TDS Collector:", TDS_COLLECTOR);
        console.log("Management Key:", MANAGEMENT_KEY);
        console.log("Sandbox Public Key:", SANDBOX_PUBLIC_KEY);
        
        // Gas usage summary
        console.log("\n=== GAS USAGE ===");
        console.log("Claim Issuer Size: ~16,197 bytes");
        console.log("Estimated deployment cost: ~3,000,000 gas");
        
        // Next steps
        console.log("\n=== NEXT STEPS ===");
        console.log("1. Deploy ERC-3643 infrastructure (IdentityRegistry, Compliance)");
        console.log("2. Initialize SimplezkETHerToken with proper parameters");
        console.log("3. Set up Sandbox API integration");
        console.log("4. Configure TDS collection mechanism");
        console.log("5. Test on testnet before mainnet deployment");
        
        // Save addresses to file for reference
        string memory addresses = string(abi.encodePacked(
            "CLAIM_ISSUER=", vm.toString(address(claimIssuer)), "\n",
            "TOKEN=", vm.toString(address(token)), "\n",
            "TDS_COLLECTOR=", vm.toString(TDS_COLLECTOR), "\n",
            "MANAGEMENT_KEY=", vm.toString(MANAGEMENT_KEY), "\n",
            "SANDBOX_KEY=", vm.toString(SANDBOX_PUBLIC_KEY)
        ));
        
        vm.writeFile("deployment-addresses.txt", addresses);
        console.log("\nAddresses saved to: deployment-addresses.txt");
    }
    
    /**
     * @notice Verify deployment integrity
     */
    function verifyDeployment() external view {
        require(address(claimIssuer) != address(0), "Claim issuer not deployed");
        require(address(token) != address(0), "Token not deployed");
        
        // Verify claim issuer configuration
        require(claimIssuer.AADHAAR_VERIFIED() == 1001, "Invalid Aadhaar topic");
        require(claimIssuer.PAN_VERIFIED() == 1002, "Invalid PAN topic");
        require(claimIssuer.FACE_MATCHED() == 1003, "Invalid face match topic");
        require(claimIssuer.ZKETHER_ELIGIBLE() == 1004, "Invalid zkETHer topic");
        require(claimIssuer.sandboxPublicKey() == SANDBOX_PUBLIC_KEY, "Invalid sandbox key");
        
        console.log("Deployment verification: PASSED");
    }
}
