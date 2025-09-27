// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "../lib/ERC-3643/contracts/token/Token.sol";
import "./SandboxAPITypes.sol";
import "./interfaces/IzkETHerToken.sol";

/**
 * @title EnhancedzkETHerToken
 * @notice ERC-3643 compliant token with full Sandbox API integration and zkETHer privacy
 * @dev Extends Token with Sandbox TDS integration, verification tracking, and zkETHer proofs
 */
contract EnhancedzkETHerToken is Token, IzkETHerToken {
    using SandboxAPITypes for *;
    
    // TDS configuration
    uint256 public override tdsRate = 100; // 1% = 100 basis points
    address public override tdsCollector;
    uint256 public override totalTDSCollected;
    
    // Sandbox API integration
    address public sandboxPublicKey;
    mapping(string => string) public tdsCertificates; // transactionId => certificate
    mapping(string => bool) public processedTransactions; // prevent replay attacks
    
    // zkETHer privacy
    mapping(bytes32 => bool) public commitments;
    mapping(bytes32 => bool) public nullifierHashes;
    mapping(address => string[]) public userVerificationIds; // track user's verification history
    
    // Modifiers
    modifier onlyVerifiedUser() {
        require(_tokenIdentityRegistry.isVerified(msg.sender), "User not verified");
        _;
    }
    
    modifier validSandboxResponse(SandboxAPITypes.TDSCalculationResponse memory _response) {
        require(bytes(_response.transaction_id).length > 0, "Invalid transaction ID");
        require(!processedTransactions[_response.transaction_id], "Transaction already processed");
        _;
    }

    /**
     * @dev Initialize the enhanced zkETHer token
     */
    function initialize(
        address _identityRegistry,
        address _compliance,
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        address _onchainID,
        address _tdsCollector,
        address _sandboxPublicKey
    ) external {
        // Call parent init function directly
        this.init(_identityRegistry, _compliance, _name, _symbol, _decimals, _onchainID);
        
        // Initialize zkETHer specific parameters
        require(_tdsCollector != address(0), "Invalid TDS collector");
        require(_sandboxPublicKey != address(0), "Invalid Sandbox key");
        
        tdsCollector = _tdsCollector;
        sandboxPublicKey = _sandboxPublicKey;
    }

    /**
     * @notice Deposit ETH with Sandbox TDS calculation
     */
    function depositWithSandboxTDS(
        bytes32 _commitment,
        SandboxAPITypes.TDSCalculationResponse memory _tdsResponse
    ) external payable override whenNotPaused onlyVerifiedUser validSandboxResponse(_tdsResponse) {
        require(msg.value == _tdsResponse.gross_amount, "Amount mismatch");
        require(!commitments[_commitment], "Commitment already exists");
        
        // Mark transaction as processed
        processedTransactions[_tdsResponse.transaction_id] = true;
        
        // Store TDS certificate
        if (bytes(_tdsResponse.tds_certificate).length > 0) {
            tdsCertificates[_tdsResponse.transaction_id] = _tdsResponse.tds_certificate;
        }
        
        // Transfer TDS to collector
        if (_tdsResponse.tds_amount > 0) {
            payable(tdsCollector).transfer(_tdsResponse.tds_amount);
            totalTDSCollected += _tdsResponse.tds_amount;
        }
        
        // Store commitment and mint tokens
        commitments[_commitment] = true;
        _mint(msg.sender, _tdsResponse.net_amount);
        
        emit Deposit(msg.sender, _tdsResponse.net_amount, _commitment);
        emit TDSDeducted(msg.sender, _tdsResponse.gross_amount, _tdsResponse.tds_amount, _tdsResponse.net_amount);
        emit SandboxTDSCalculated(_tdsResponse.transaction_id, _tdsResponse.gross_amount, _tdsResponse.tds_amount);
    }

    /**
     * @notice Standard deposit with local TDS calculation (fallback)
     */
    function deposit(bytes32 _commitment) external payable override whenNotPaused onlyVerifiedUser {
        require(msg.value > 0, "Must deposit ETH");
        require(!commitments[_commitment], "Commitment already exists");
        
        uint256 tdsAmount = calculateTDS(msg.value);
        uint256 netAmount = msg.value - tdsAmount;
        
        if (tdsAmount > 0) {
            payable(tdsCollector).transfer(tdsAmount);
            totalTDSCollected += tdsAmount;
            emit TDSDeducted(msg.sender, msg.value, tdsAmount, netAmount);
        }
        
        commitments[_commitment] = true;
        _mint(msg.sender, netAmount);
        
        emit Deposit(msg.sender, netAmount, _commitment);
    }

    /**
     * @notice Withdraw with Sandbox TDS calculation and zkETHer proof
     */
    function withdrawWithSandboxTDS(
        uint256 _amount,
        bytes32 _nullifierHash,
        bytes memory _proof,
        SandboxAPITypes.TDSCalculationResponse memory _tdsResponse
    ) external override whenNotPaused onlyVerifiedUser validSandboxResponse(_tdsResponse) {
        require(_amount == _tdsResponse.gross_amount, "Amount mismatch");
        require(!nullifierHashes[_nullifierHash], "Nullifier already used");
        require(verifyzkETHerProof(_nullifierHash, bytes32(0), _proof), "Invalid zkETHer proof");
        
        // Mark transaction as processed and nullifier as used
        processedTransactions[_tdsResponse.transaction_id] = true;
        nullifierHashes[_nullifierHash] = true;
        
        // Store TDS certificate
        if (bytes(_tdsResponse.tds_certificate).length > 0) {
            tdsCertificates[_tdsResponse.transaction_id] = _tdsResponse.tds_certificate;
        }
        
        // Burn tokens
        _burn(msg.sender, _amount);
        
        // Transfer net amount to user
        payable(msg.sender).transfer(_tdsResponse.net_amount);
        
        // Transfer TDS to collector
        if (_tdsResponse.tds_amount > 0) {
            payable(tdsCollector).transfer(_tdsResponse.tds_amount);
            totalTDSCollected += _tdsResponse.tds_amount;
        }
        
        emit Withdrawal(msg.sender, _tdsResponse.net_amount, _nullifierHash);
        emit TDSDeducted(msg.sender, _tdsResponse.gross_amount, _tdsResponse.tds_amount, _tdsResponse.net_amount);
        emit SandboxTDSCalculated(_tdsResponse.transaction_id, _tdsResponse.gross_amount, _tdsResponse.tds_amount);
    }

    /**
     * @notice Standard withdrawal with local TDS calculation (fallback)
     */
    function withdraw(
        uint256 _amount,
        bytes32 _nullifierHash,
        bytes memory _proof
    ) external override whenNotPaused onlyVerifiedUser {
        require(_amount > 0, "Amount must be greater than 0");
        require(!nullifierHashes[_nullifierHash], "Nullifier already used");
        require(verifyzkETHerProof(_nullifierHash, bytes32(0), _proof), "Invalid zkETHer proof");
        
        uint256 tdsAmount = calculateTDS(_amount);
        uint256 netAmount = _amount - tdsAmount;
        
        nullifierHashes[_nullifierHash] = true;
        _burn(msg.sender, _amount);
        
        payable(msg.sender).transfer(netAmount);
        
        if (tdsAmount > 0) {
            payable(tdsCollector).transfer(tdsAmount);
            totalTDSCollected += tdsAmount;
            emit TDSDeducted(msg.sender, _amount, tdsAmount, netAmount);
        }
        
        emit Withdrawal(msg.sender, netAmount, _nullifierHash);
    }

    /**
     * @notice Transfer with Sandbox TDS calculation
     */
    function transferWithSandboxTDS(
        address _to,
        uint256 _amount,
        SandboxAPITypes.TDSCalculationResponse memory _tdsResponse
    ) external override whenNotPaused onlyVerifiedUser validSandboxResponse(_tdsResponse) returns (bool) {
        require(_tokenIdentityRegistry.isVerified(_to), "Recipient not verified");
        require(_amount == _tdsResponse.gross_amount, "Amount mismatch");
        
        // Mark transaction as processed
        processedTransactions[_tdsResponse.transaction_id] = true;
        
        // Store TDS certificate
        if (bytes(_tdsResponse.tds_certificate).length > 0) {
            tdsCertificates[_tdsResponse.transaction_id] = _tdsResponse.tds_certificate;
        }
        
        // Transfer TDS to collector
        if (_tdsResponse.tds_amount > 0) {
            _transfer(msg.sender, tdsCollector, _tdsResponse.tds_amount);
            totalTDSCollected += _tdsResponse.tds_amount;
            emit TDSDeducted(msg.sender, _tdsResponse.gross_amount, _tdsResponse.tds_amount, _tdsResponse.net_amount);
        }
        
        // Transfer net amount to recipient
        _transfer(msg.sender, _to, _tdsResponse.net_amount);
        emit SandboxTDSCalculated(_tdsResponse.transaction_id, _tdsResponse.gross_amount, _tdsResponse.tds_amount);
        
        return true;
    }

    /**
     * @notice Standard transfer with local TDS calculation
     */
    function transferWithTDS(address _to, uint256 _amount) external override whenNotPaused onlyVerifiedUser returns (bool) {
        require(_tokenIdentityRegistry.isVerified(_to), "Recipient not verified");
        
        uint256 tdsAmount = calculateTDS(_amount);
        uint256 netAmount = _amount - tdsAmount;
        
        if (tdsAmount > 0) {
            _transfer(msg.sender, tdsCollector, tdsAmount);
            totalTDSCollected += tdsAmount;
            emit TDSDeducted(msg.sender, _amount, tdsAmount, netAmount);
        }
        
        _transfer(msg.sender, _to, netAmount);
        return true;
    }

    /**
     * @notice TransferFrom with TDS deduction
     */
    function transferFromWithTDS(address _from, address _to, uint256 _amount) external override whenNotPaused returns (bool) {
        require(_tokenIdentityRegistry.isVerified(_to), "Recipient not verified");
        
        uint256 currentAllowance = _allowances[_from][msg.sender];
        require(currentAllowance >= _amount, "ERC20: transfer amount exceeds allowance");
        
        uint256 tdsAmount = calculateTDS(_amount);
        uint256 netAmount = _amount - tdsAmount;
        
        if (tdsAmount > 0) {
            _transfer(_from, tdsCollector, tdsAmount);
            totalTDSCollected += tdsAmount;
            emit TDSDeducted(_from, _amount, tdsAmount, netAmount);
        }
        
        _transfer(_from, _to, netAmount);
        _approve(_from, msg.sender, currentAllowance - _amount);
        
        return true;
    }

    /**
     * @notice Verify zkETHer zero-knowledge proof
     * @dev This is a placeholder - integrate with actual zkETHer circuit
     */
    function verifyzkETHerProof(
        bytes32 _nullifierHash,
        bytes32 _commitment,
        bytes memory _proof
    ) public pure override returns (bool) {
        // TODO: Integrate with actual zkETHer circuit verification
        // For now, just check proof is not empty
        return _proof.length > 0 && _nullifierHash != bytes32(0);
    }

    /**
     * @notice Validate Sandbox TDS response
     */
    function verifySandboxTDSSignature(
        SandboxAPITypes.TDSCalculationResponse memory _response
    ) public pure override returns (bool) {
        // Simple validation: check required fields are present
        return bytes(_response.transaction_id).length > 0 && 
               _response.gross_amount > 0 &&
               _response.net_amount > 0;
    }

    /**
     * @notice Store TDS certificate for audit purposes
     */
    function storeTDSCertificate(
        string memory _transactionId,
        string memory _certificate
    ) external override onlyOwner {
        tdsCertificates[_transactionId] = _certificate;
    }

    /**
     * @notice Calculate TDS amount
     */
    function calculateTDS(uint256 _amount) public view override returns (uint256) {
        return (_amount * tdsRate) / 10000;
    }

    // View functions
    function isCommitmentUsed(bytes32 _commitment) external view override returns (bool) {
        return commitments[_commitment];
    }

    function isNullifierUsed(bytes32 _nullifierHash) external view override returns (bool) {
        return nullifierHashes[_nullifierHash];
    }

    function getContractBalance() external view override returns (uint256) {
        return address(this).balance;
    }

    function getTDSCertificate(string memory _transactionId) external view override returns (string memory) {
        return tdsCertificates[_transactionId];
    }

    // Admin functions
    function setTDSRate(uint256 _newRate) external override onlyOwner {
        require(_newRate <= 1000, "TDS rate cannot exceed 10%");
        uint256 oldRate = tdsRate;
        tdsRate = _newRate;
        emit TDSRateUpdated(oldRate, _newRate);
    }

    function setTDSCollector(address _newCollector) external override onlyOwner {
        require(_newCollector != address(0), "Invalid collector address");
        address oldCollector = tdsCollector;
        tdsCollector = _newCollector;
        emit TDSCollectorUpdated(oldCollector, _newCollector);
    }

    function emergencyWithdraw() external override onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function pauseToken() external override onlyOwner {
        _tokenPaused = true;
    }

    function unpauseToken() external override onlyOwner {
        _tokenPaused = false;
    }

    // Custom pause functions that don't conflict with Token contract
    function pauseContract() external onlyOwner {
        _tokenPaused = true;
    }

    function unpauseContract() external onlyOwner {
        _tokenPaused = false;
    }

    receive() external payable {}
}
