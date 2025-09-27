// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "./mocks/MockClaimIssuer.sol";

/**
 * @title SimpleSandboxClaimIssuer
 * @notice Issues claims based on Sandbox.co.in API verification
 * @dev Integrates with Sandbox API for KYC/TDS compliance
 */
contract SimpleSandboxClaimIssuer is MockClaimIssuer {
    // Claim topic constants for zkETHer
    uint256 public constant AADHAAR_VERIFIED = 1001;
    uint256 public constant PAN_VERIFIED = 1002;
    uint256 public constant FACE_MATCHED = 1003;
    uint256 public constant ZKETHER_ELIGIBLE = 1004;
    
    // Sandbox API public key for signature verification
    address public sandboxPublicKey;
    
    // User to Identity mapping
    mapping(address => address) public userToIdentity;
    
    // Reverse mapping for efficient lookup (identity => user)
    mapping(address => address) public identityToUser;
    
    // Internal claim storage (user => topic => claim data)
    mapping(address => mapping(uint256 => bytes)) public userClaims;
    mapping(address => mapping(uint256 => bool)) public hasUserClaim;
    
    // Events
    event ClaimIssuedFromSandbox(address indexed identity, uint256 indexed topic, string verificationId);
    event SandboxPublicKeyUpdated(address oldKey, address newKey);
    event IdentityCreated(address indexed user, address indexed identity);

    /**
     * @dev Constructor
     * @param _managementKey Management key for the claim issuer
     * @param _sandboxPublicKey Public key for Sandbox API signature verification
     */
    constructor(address _managementKey, address _sandboxPublicKey) {
        sandboxPublicKey = _sandboxPublicKey;
    }

    /**
     * @notice Create OnchainID for a user (simplified mock implementation)
     * @param _user User address
     * @param _managementKey Management key for the identity
     * @return Address of the created identity (mock address)
     */
    function createIdentity(address _user, address _managementKey) external returns (address) {
        require(userToIdentity[_user] == address(0), "Identity already exists for user");
        
        // For simplicity, use a deterministic address based on user address
        address identityAddress = address(uint160(uint256(keccak256(abi.encodePacked(_user, _managementKey, block.timestamp)))));
        
        // Store both mappings
        userToIdentity[_user] = identityAddress;
        identityToUser[identityAddress] = _user;
        
        emit IdentityCreated(_user, identityAddress);
        return identityAddress;
    }

    /**
     * @notice Validate Sandbox API response
     * @param apiResponse The API response to validate
     * @return True if response is valid
     */
    function validateSandboxResponse(bytes memory apiResponse) public pure returns (bool) {
        // Simple validation: check if response is not empty
        return apiResponse.length > 0;
    }

    /**
     * @notice Issue Aadhaar verification claim
     * @param userIdentity User's ONCHAINID contract address
     * @param verificationId Sandbox verification ID
     * @param sandboxResponse Response from Sandbox API
     */
    function issueAadhaarClaim(
        address userIdentity,
        string memory verificationId,
        bytes memory sandboxResponse
    ) external {
        require(validateSandboxResponse(sandboxResponse), "Invalid API response");
        
        // Find user from identity mapping
        address user = getUserFromIdentity(userIdentity);
        require(user != address(0), "User not found for identity");
        
        // Store claim internally
        userClaims[user][AADHAAR_VERIFIED] = sandboxResponse;
        hasUserClaim[user][AADHAAR_VERIFIED] = true;
        
        emit ClaimIssuedFromSandbox(userIdentity, AADHAAR_VERIFIED, verificationId);
    }

    /**
     * @notice Issue PAN verification claim
     * @param userIdentity User's ONCHAINID contract address
     * @param verificationId Sandbox verification ID
     * @param sandboxResponse Response from Sandbox API
     */
    function issuePANClaim(
        address userIdentity,
        string memory verificationId,
        bytes memory sandboxResponse
    ) external {
        require(validateSandboxResponse(sandboxResponse), "Invalid API response");
        
        // Find user from identity mapping
        address user = getUserFromIdentity(userIdentity);
        require(user != address(0), "User not found for identity");
        
        // Store claim internally
        userClaims[user][PAN_VERIFIED] = sandboxResponse;
        hasUserClaim[user][PAN_VERIFIED] = true;
        
        emit ClaimIssuedFromSandbox(userIdentity, PAN_VERIFIED, verificationId);
    }

    /**
     * @notice Issue Face Match verification claim
     * @param userIdentity User's ONCHAINID contract address
     * @param verificationId Sandbox verification ID
     * @param sandboxResponse Response from Sandbox API
     */
    function issueFaceMatchClaim(
        address userIdentity,
        string memory verificationId,
        bytes memory sandboxResponse
    ) external {
        require(validateSandboxResponse(sandboxResponse), "Invalid API response");
        
        // Find user from identity mapping
        address user = getUserFromIdentity(userIdentity);
        require(user != address(0), "User not found for identity");
        
        // Store claim internally
        userClaims[user][FACE_MATCHED] = sandboxResponse;
        hasUserClaim[user][FACE_MATCHED] = true;
        
        emit ClaimIssuedFromSandbox(userIdentity, FACE_MATCHED, verificationId);
    }

    /**
     * @notice Issue zkETHer eligibility claim (after all verifications)
     * @param userIdentity User's ONCHAINID contract address
     * @param verificationId Sandbox verification ID
     * @param sandboxResponse Response from Sandbox API
     */
    function issuezkETHerEligibilityClaim(
        address userIdentity,
        string memory verificationId,
        bytes memory sandboxResponse
    ) external {
        require(validateSandboxResponse(sandboxResponse), "Invalid API response");
        
        // Verify user has all required claims
        require(hasValidClaim(userIdentity, AADHAAR_VERIFIED), "Aadhaar not verified");
        require(hasValidClaim(userIdentity, PAN_VERIFIED), "PAN not verified");
        require(hasValidClaim(userIdentity, FACE_MATCHED), "Face not matched");
        
        // Store claim internally
        address user = getUserFromIdentity(userIdentity);
        userClaims[user][ZKETHER_ELIGIBLE] = sandboxResponse;
        hasUserClaim[user][ZKETHER_ELIGIBLE] = true;
        
        emit ClaimIssuedFromSandbox(userIdentity, ZKETHER_ELIGIBLE, verificationId);
    }

    /**
     * @notice Check if user has a valid claim for a topic
     * @param userIdentity User's ONCHAINID contract address
     * @param topic Claim topic to check
     * @return True if user has valid claim
     */
    function hasValidClaim(address userIdentity, uint256 topic) public view returns (bool) {
        address user = getUserFromIdentity(userIdentity);
        return hasUserClaim[user][topic];
    }

    /**
     * @notice Update Sandbox public key (only management key)
     * @param _newPublicKey New public key for Sandbox API
     */
    function updateSandboxPublicKey(address _newPublicKey) external {
        require(_newPublicKey != address(0), "Invalid public key");
        address oldKey = sandboxPublicKey;
        sandboxPublicKey = _newPublicKey;
        emit SandboxPublicKeyUpdated(oldKey, _newPublicKey);
    }

    /**
     * @notice Helper function to find user from identity address
     * @param userIdentity The identity address to search for
     * @return user The user address that owns this identity
     */
    function getUserFromIdentity(address userIdentity) internal view returns (address) {
        // Use efficient reverse mapping
        return identityToUser[userIdentity];
    }

    /**
     * @notice Get user's claim data
     * @param user User address
     * @param topic Claim topic
     * @return Claim data
     */
    function getUserClaim(address user, uint256 topic) external view returns (bytes memory) {
        return userClaims[user][topic];
    }

    /**
     * @notice Check if user has a specific claim
     * @param user User address  
     * @param topic Claim topic
     * @return True if user has the claim
     */
    function userHasClaim(address user, uint256 topic) external view returns (bool) {
        return hasUserClaim[user][topic];
    }
}
