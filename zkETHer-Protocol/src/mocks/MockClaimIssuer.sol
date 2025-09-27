// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MockClaimIssuer is Ownable {
    mapping(address => mapping(uint256 => bool)) public claims;
    mapping(address => bool) public identities;
    
    event ClaimAdded(address indexed identity, uint256 indexed claimType);
    event IdentityCreated(address indexed identity);
    
    constructor() Ownable(msg.sender) {}
    
    function createIdentity(address identity) external onlyOwner {
        identities[identity] = true;
        emit IdentityCreated(identity);
    }
    
    function addClaim(address identity, uint256 claimType) external onlyOwner {
        require(identities[identity], "Identity not found");
        claims[identity][claimType] = true;
        emit ClaimAdded(identity, claimType);
    }
    
    function hasClaim(address identity, uint256 claimType) external view returns (bool) {
        return claims[identity][claimType];
    }
    
    function isVerified(address identity) external view returns (bool) {
        return identities[identity] && claims[identity][1]; // Claim type 1 = KYC verified
    }
}
