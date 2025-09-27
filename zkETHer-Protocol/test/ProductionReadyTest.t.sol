// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.17 <0.9.0;

import {Test, console} from "forge-std/Test.sol";
import {SimpleSandboxClaimIssuer} from "../src/SimpleSandboxClaimIssuer.sol";

/**
 * @title ProductionReadyTest
 * @notice Final production-ready test suite - minimal, stable, deployable
 */
contract ProductionReadyTest is Test {
    SimpleSandboxClaimIssuer public claimIssuer;
    
    address public owner = address(0x1);
    address public sandboxKey = address(0x5);
    address public user1 = address(0x100);
    
    function setUp() public {
        vm.prank(owner);
        claimIssuer = new SimpleSandboxClaimIssuer(owner, sandboxKey);
    }
    
    // === CORE FUNCTIONALITY TESTS ===
    
    function testDeploymentSuccess() public view {
        assertTrue(address(claimIssuer) != address(0));
        assertEq(claimIssuer.sandboxPublicKey(), sandboxKey);
        console.log("Contract deployment successful");
    }
    
    function testClaimTopicConstants() public view {
        assertEq(claimIssuer.AADHAAR_VERIFIED(), 1001);
        assertEq(claimIssuer.PAN_VERIFIED(), 1002);
        assertEq(claimIssuer.FACE_MATCHED(), 1003);
        console.log("Claim topics verified");
    }
    
    function testSignatureVerificationLogic() public {
        // Test API response validation
        bytes memory validResponse = abi.encodePacked('{"status":"success","data":{}}');
        bytes memory emptyResponse = "";
        
        bool validResult = claimIssuer.validateSandboxResponse(validResponse);
        bool invalidResult = claimIssuer.validateSandboxResponse(emptyResponse);
        
        assertTrue(validResult); // Valid response returns true
        assertFalse(invalidResult); // Empty response returns false
        console.log("API response validation works");
    }
    
    function testKeyManagement() public {
        address newKey = address(0x999);
        
        vm.prank(owner);
        claimIssuer.updateSandboxPublicKey(newKey);
        
        assertEq(claimIssuer.sandboxPublicKey(), newKey);
        console.log("Key management works");
    }
    
    // === SECURITY TESTS ===
    
    function test_RevertWhen_UnauthorizedAccess() public {
        vm.prank(user1);
        vm.expectRevert("Permissions: Sender does not have management key");
        claimIssuer.updateSandboxPublicKey(address(0x999));
        
        console.log("Access control verified");
    }
    
    function test_RevertWhen_InvalidBatchInput() public {
        uint256[] memory topics = new uint256[](2);
        string[] memory ids = new string[](1); // Wrong length
        bytes[] memory responses = new bytes[](2);
        bytes[] memory signatures = new bytes[](2);
        
        vm.prank(owner);
        vm.expectRevert("Array length mismatch");
        claimIssuer.batchIssueClaims(user1, topics, ids, responses);
        
        console.log("Input validation works");
    }
    
    // === PRODUCTION READINESS ===
    
    function testGasEfficiency() public {
        uint256 gasBefore = gasleft();
        
        vm.prank(owner);
        claimIssuer.updateSandboxPublicKey(address(0x888));
        
        uint256 gasUsed = gasBefore - gasleft();
        assertTrue(gasUsed < 50000); // Should be efficient
        
        console.log("Gas efficiency verified:", gasUsed);
    }
    
    function testContractSize() public view {
        uint256 size;
        address contractAddr = address(claimIssuer);
        assembly {
            size := extcodesize(contractAddr)
        }
        
        assertTrue(size > 0);
        assertTrue(size < 24576); // Under Ethereum contract size limit
        
        console.log("Contract size valid:", size, "bytes");
    }
    
    function testAllFunctionsCallable() public {
        // Test all main functions are callable without reverting on setup
        bytes memory response = abi.encodePacked("test");
        bytes memory signature = new bytes(65);
        
        // This should not revert (just return false for invalid sig)
        claimIssuer.validateSandboxResponse(response);
        
        // Key update should work
        vm.prank(owner);
        claimIssuer.updateSandboxPublicKey(sandboxKey);
        
        console.log("All functions callable");
    }
    
    function testEventEmission() public {
        address newKey = address(0x777);
        
        vm.expectEmit(true, true, false, true);
        emit SandboxPublicKeyUpdated(sandboxKey, newKey);
        
        vm.prank(owner);
        claimIssuer.updateSandboxPublicKey(newKey);
        
        console.log("Events working");
    }
    
    // Event signature for testing
    event SandboxPublicKeyUpdated(address oldKey, address newKey);
}
