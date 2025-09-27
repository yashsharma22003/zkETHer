// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.17 <0.9.0;

import "../SandboxAPITypes.sol";

/**
 * @title IzkETHerToken
 * @notice Interface for zkETHer token with TDS and privacy features
 */
interface IzkETHerToken {
    
    // Events
    event Deposit(address indexed user, uint256 amount, bytes32 commitment);
    event Withdrawal(address indexed user, uint256 amount, bytes32 nullifierHash);
    event TDSDeducted(address indexed user, uint256 grossAmount, uint256 tdsAmount, uint256 netAmount);
    event TDSRateUpdated(uint256 oldRate, uint256 newRate);
    event TDSCollectorUpdated(address oldCollector, address newCollector);
    event SandboxTDSCalculated(string indexed transactionId, uint256 grossAmount, uint256 tdsAmount);
    
    // Core zkETHer functions
    function deposit(bytes32 _commitment) external payable;
    
    function withdraw(
        uint256 _amount,
        bytes32 _nullifierHash,
        bytes memory _proof
    ) external;
    
    function depositWithSandboxTDS(
        bytes32 _commitment,
        SandboxAPITypes.TDSCalculationResponse memory _tdsResponse
    ) external payable;
    
    function withdrawWithSandboxTDS(
        uint256 _amount,
        bytes32 _nullifierHash,
        bytes memory _proof,
        SandboxAPITypes.TDSCalculationResponse memory _tdsResponse
    ) external;
    
    // Transfer functions with TDS
    function transferWithTDS(address _to, uint256 _amount) external returns (bool);
    
    function transferFromWithTDS(address _from, address _to, uint256 _amount) external returns (bool);
    
    function transferWithSandboxTDS(
        address _to, 
        uint256 _amount,
        SandboxAPITypes.TDSCalculationResponse memory _tdsResponse
    ) external returns (bool);
    
    // Privacy functions
    function verifyzkETHerProof(
        bytes32 _nullifierHash,
        bytes32 _commitment,
        bytes memory _proof
    ) external view returns (bool);
    
    function isCommitmentUsed(bytes32 _commitment) external view returns (bool);
    function isNullifierUsed(bytes32 _nullifierHash) external view returns (bool);
    
    // TDS management
    function setTDSRate(uint256 _newRate) external;
    function setTDSCollector(address _newCollector) external;
    function calculateTDS(uint256 _amount) external view returns (uint256);
    
    // Sandbox integration
    function verifySandboxTDSSignature(
        SandboxAPITypes.TDSCalculationResponse memory _response
    ) external view returns (bool);
    
    function storeTDSCertificate(
        string memory _transactionId,
        string memory _certificate
    ) external;
    
    // View functions
    function tdsRate() external view returns (uint256);
    function tdsCollector() external view returns (address);
    function totalTDSCollected() external view returns (uint256);
    function getContractBalance() external view returns (uint256);
    function getTDSCertificate(string memory _transactionId) external view returns (string memory);
    
    // Admin functions
    function emergencyWithdraw() external;
    function pauseToken() external;
    function unpauseToken() external;
}
