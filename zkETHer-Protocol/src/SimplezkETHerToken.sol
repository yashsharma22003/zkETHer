// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./mocks/MockToken.sol";

/**
 * @title SimplezkETHerToken
 * @notice Simplified ERC-3643 compliant token with zkETHer integration and TDS support
 * @dev Extends standard Token with deposit/withdrawal functions and TDS calculation
 */
contract SimplezkETHerToken is MockToken {
    // TDS rate (1% = 100 basis points)
    uint256 public tdsRate = 100;
    
    // TDS collector address
    address public tdsCollector;
    
    // Total TDS collected
    uint256 public totalTDSCollected;
    
    // zkETHer commitments and nullifiers
    mapping(bytes32 => bool) public commitments;
    mapping(bytes32 => bool) public nullifierHashes;

    // Token configuration constants
    string public constant DEFAULT_NAME = "zkETHer Token";
    string public constant DEFAULT_SYMBOL = "zkETH";
    uint8 public constant DEFAULT_DECIMALS = 18;
    
    // Events
    event Deposit(address indexed user, uint256 amount, bytes32 commitment);
    event Withdrawal(address indexed user, uint256 amount, bytes32 nullifierHash);
    event TDSDeducted(address indexed user, uint256 grossAmount, uint256 tdsAmount, uint256 netAmount);
    event TDSRateUpdated(uint256 oldRate, uint256 newRate);
    event TDSCollectorUpdated(address oldCollector, address newCollector);

    /**
     * @dev Initialize the token (called after deployment)
     */
    function initialize(
        address _identityRegistry,
        address _compliance,
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        address _onchainID,
        address _tdsCollector
    ) external {
        require(_tdsCollector != address(0), "Invalid TDS collector");
        tdsCollector = _tdsCollector;
        this.init(_identityRegistry, _compliance, _name, _symbol, _decimals, _onchainID);
    }

    /**
     * @dev Initialize with default token configuration
     */
    function initializeWithDefaults(
        address _identityRegistry,
        address _compliance,
        address _onchainID,
        address _tdsCollector
    ) external {
        require(_tdsCollector != address(0), "Invalid TDS collector");
        tdsCollector = _tdsCollector;
        this.init(_identityRegistry, _compliance, DEFAULT_NAME, DEFAULT_SYMBOL, DEFAULT_DECIMALS, _onchainID);
    }

    /**
     * @notice Deposit ETH and mint zkETH tokens with TDS deduction
     * @param _commitment zkETHer commitment hash
     */
    function deposit(bytes32 _commitment) external payable whenNotPaused {
        require(msg.value > 0, "Must deposit ETH");
        require(_tokenIdentityRegistry.isVerified(msg.sender), "Identity not verified");
        require(!commitments[_commitment], "Commitment already exists");
        
        // Calculate TDS
        uint256 tdsAmount = (msg.value * tdsRate) / 10000;
        uint256 netAmount = msg.value - tdsAmount;
        
        // Transfer TDS to collector
        if (tdsAmount > 0) {
            payable(tdsCollector).transfer(tdsAmount);
            totalTDSCollected += tdsAmount;
            emit TDSDeducted(msg.sender, msg.value, tdsAmount, netAmount);
        }
        
        // Store commitment
        commitments[_commitment] = true;
        
        // Mint tokens
        _mint(msg.sender, netAmount);
        
        emit Deposit(msg.sender, netAmount, _commitment);
    }

    /**
     * @notice Withdraw ETH by burning zkETH tokens with zero-knowledge proof
     * @param _amount Amount to withdraw
     * @param _nullifierHash Nullifier hash to prevent double spending
     * @param _proof Zero-knowledge proof (placeholder for now)
     */
    function withdraw(
        uint256 _amount,
        bytes32 _nullifierHash,
        bytes memory _proof
    ) external whenNotPaused {
        require(_amount > 0, "Amount must be greater than 0");
        require(!nullifierHashes[_nullifierHash], "Nullifier already used");
        require(_tokenIdentityRegistry.isVerified(msg.sender), "Identity not verified");
        
        // TODO: Verify zero-knowledge proof
        // For now, we'll use a placeholder verification
        require(_proof.length > 0, "Invalid proof");
        
        // Calculate TDS on withdrawal
        uint256 tdsAmount = (_amount * tdsRate) / 10000;
        uint256 netAmount = _amount - tdsAmount;
        
        // Mark nullifier as used
        nullifierHashes[_nullifierHash] = true;
        
        // Burn tokens
        _burn(msg.sender, _amount);
        
        // Transfer ETH to user (net of TDS)
        payable(msg.sender).transfer(netAmount);
        
        // Transfer TDS to collector
        if (tdsAmount > 0) {
            payable(tdsCollector).transfer(tdsAmount);
            totalTDSCollected += tdsAmount;
            emit TDSDeducted(msg.sender, _amount, tdsAmount, netAmount);
        }
        
        emit Withdrawal(msg.sender, netAmount, _nullifierHash);
    }

    /**
     * @notice Calculate TDS amount for a given value
     */
    function calculateTDS(uint256 _amount) public view returns (uint256) {
        return (_amount * tdsRate) / 10000;
    }

    /**
     * @notice Transfer with TDS deduction
     */
    function transferWithTDS(address _to, uint256 _amount) public whenNotPaused returns (bool) {
        require(_tokenIdentityRegistry.isVerified(_to), "Recipient not verified");
        
        // Calculate TDS
        uint256 tdsAmount = (_amount * tdsRate) / 10000;
        uint256 netAmount = _amount - tdsAmount;
        
        // Transfer TDS to collector
        if (tdsAmount > 0) {
            _transfer(msg.sender, tdsCollector, tdsAmount);
            totalTDSCollected += tdsAmount;
            emit TDSDeducted(msg.sender, _amount, tdsAmount, netAmount);
        }
        
        // Transfer net amount to recipient
        _transfer(msg.sender, _to, netAmount);
        return true;
    }

    /**
     * @notice TransferFrom with TDS deduction
     */
    function transferFromWithTDS(address _from, address _to, uint256 _amount) public whenNotPaused returns (bool) {
        require(_tokenIdentityRegistry.isVerified(_to), "Recipient not verified");
        
        // Check allowance
        uint256 currentAllowance = _allowances[_from][msg.sender];
        require(currentAllowance >= _amount, "ERC20: transfer amount exceeds allowance");
        
        // Calculate TDS
        uint256 tdsAmount = (_amount * tdsRate) / 10000;
        uint256 netAmount = _amount - tdsAmount;
        
        // Transfer TDS to collector
        if (tdsAmount > 0) {
            _transfer(_from, tdsCollector, tdsAmount);
            totalTDSCollected += tdsAmount;
            emit TDSDeducted(_from, _amount, tdsAmount, netAmount);
        }
        
        // Transfer net amount to recipient
        _transfer(_from, _to, netAmount);
        
        // Update allowance
        _approve(_from, msg.sender, currentAllowance - _amount);
        
        return true;
    }

    /**
     * @notice Set TDS rate (only owner)
     * @param _newRate New TDS rate in basis points
     */
    function setTDSRate(uint256 _newRate) external onlyOwner {
        require(_newRate <= 1000, "TDS rate cannot exceed 10%");
        uint256 oldRate = tdsRate;
        tdsRate = _newRate;
        emit TDSRateUpdated(oldRate, _newRate);
    }

    /**
     * @notice Set TDS collector address (only owner)
     * @param _newCollector New TDS collector address
     */
    function setTDSCollector(address _newCollector) external onlyOwner {
        require(_newCollector != address(0), "Invalid collector address");
        address oldCollector = tdsCollector;
        tdsCollector = _newCollector;
        emit TDSCollectorUpdated(oldCollector, _newCollector);
    }

    /**
     * @notice Get contract ETH balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Emergency withdraw (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @notice Receive ETH
     */
    receive() external payable {}
}
