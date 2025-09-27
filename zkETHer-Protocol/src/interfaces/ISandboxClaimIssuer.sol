// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "../SandboxAPITypes.sol";

/**
 * @title ISandboxClaimIssuer
 * @notice Interface for Sandbox API claim issuer
 */
interface ISandboxClaimIssuer {
    
    // Events
    event ClaimIssuedFromSandbox(
        address indexed identity, 
        uint256 indexed topic, 
        string verificationId
    );
    
    event SandboxPublicKeyUpdated(address oldKey, address newKey);
    
    // Core claim issuance functions
    function issueAadhaarClaim(
        address userIdentity,
        string memory verificationId,
        bytes memory sandboxResponse,
        bytes memory sandboxSignature
    ) external;
    
    function issuePANClaim(
        address userIdentity,
        string memory verificationId,
        bytes memory sandboxResponse,
        bytes memory sandboxSignature
    ) external;
    
    function issueFaceMatchClaim(
        address userIdentity,
        string memory verificationId,
        bytes memory sandboxResponse,
        bytes memory sandboxSignature
    ) external;
    
    function issuezkETHerEligibilityClaim(
        address userIdentity,
        string memory verificationId,
        bytes memory sandboxResponse,
        bytes memory sandboxSignature
    ) external;
    
    // Batch operations
    function batchIssueClaims(
        address userIdentity,
        uint256[] memory topics,
        string[] memory verificationIds,
        bytes[] memory sandboxResponses,
        bytes[] memory sandboxSignatures
    ) external;
    
    // Verification functions
    function verifySandboxSignature(
        bytes memory message, 
        bytes memory signature
    ) external view returns (bool);
    
    function hasValidClaim(
        address userIdentity, 
        uint256 topic
    ) external view returns (bool);
    
    // Admin functions
    function updateSandboxPublicKey(address _newPublicKey) external;
    
    // View functions
    function sandboxPublicKey() external view returns (address);
    function AADHAAR_VERIFIED() external view returns (uint256);
    function PAN_VERIFIED() external view returns (uint256);
    function FACE_MATCHED() external view returns (uint256);
    function ZKETHER_ELIGIBLE() external view returns (uint256);
}
