// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

/**
 * @title SandboxAPITypes
 * @notice Data structures for Sandbox API integration
 * @dev Defines structs for API requests and responses
 */
library SandboxAPITypes {
    
    // Verification request structures
    struct AadhaarVerificationRequest {
        string aadhaar_number;
        string name;
        string dob;
        string user_address;
        string document_image; // base64 encoded
    }
    
    struct PANVerificationRequest {
        string pan_number;
        string name;
        string father_name;
        string dob;
        string document_image; // base64 encoded
    }
    
    struct FaceMatchRequest {
        string aadhaar_photo; // base64 encoded
        string selfie_image;  // base64 encoded
    }
    
    // Verification response structures
    struct VerificationResponse {
        string verification_id;
        string status;
        uint256 timestamp;
        string verification_type;
        uint256 confidence_score; // scaled by 10000 (0.98 = 9800)
        ExtractedData extracted_data;
        bytes signature;
    }
    
    struct ExtractedData {
        string name;
        string aadhaar_number;
        string pan_number;
        string dob;
        string user_address;
        string father_name;
    }
    
    // TDS calculation structures
    struct TDSCalculationRequest {
        uint256 gross_amount;
        string transaction_type; // "deposit", "withdrawal", "transfer"
        string user_pan;
    }
    
    struct TDSCalculationResponse {
        string transaction_id;
        uint256 gross_amount;
        uint256 tds_rate; // scaled by 10000 (1% = 100)
        uint256 tds_amount;
        uint256 net_amount;
        string tds_certificate; // base64 encoded
        bytes signature;
    }
    
    // Claim verification structure
    struct ClaimData {
        uint256 claim_topic;
        string verification_id;
        uint256 timestamp;
        uint256 confidence_score;
        bytes extracted_data; // ABI encoded ExtractedData
        bytes sandbox_signature;
    }
    
    // Batch verification structure
    struct BatchVerificationRequest {
        AadhaarVerificationRequest aadhaar;
        PANVerificationRequest pan;
        FaceMatchRequest face_match;
        address user_identity; // OnchainID address
    }
    
    struct BatchVerificationResponse {
        VerificationResponse[] verifications;
        bool all_verified;
        uint256 total_confidence_score;
    }
    
    // Events for tracking API interactions
    event SandboxAPIRequest(
        address indexed user,
        string request_type,
        string request_id,
        uint256 timestamp
    );
    
    event SandboxAPIResponse(
        address indexed user,
        string verification_id,
        string status,
        uint256 confidence_score,
        uint256 timestamp
    );
    
    event TDSCalculated(
        address indexed user,
        string transaction_id,
        uint256 gross_amount,
        uint256 tds_amount,
        uint256 net_amount
    );
}
