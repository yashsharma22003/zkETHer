// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockToken is ERC20, Ownable {
    mapping(address => bool) public verified;
    
    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender) {}
    
    function setVerified(address account, bool status) external onlyOwner {
        verified[account] = status;
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        require(verified[to], "Account not verified");
        _mint(to, amount);
    }
    
    function transfer(address to, uint256 amount) public override returns (bool) {
        require(verified[msg.sender], "Sender not verified");
        require(verified[to], "Recipient not verified");
        return super.transfer(to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        require(verified[from], "Sender not verified");
        require(verified[to], "Recipient not verified");
        return super.transferFrom(from, to, amount);
    }
}
