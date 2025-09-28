import { formatEther, parseEther, keccak256, toBytes, encodePacked } from 'viem';
import { writeContract, readContract, getAccount } from '@wagmi/core';
import { wagmiConfig } from '../config/walletConnect';
import { networkService } from './networkService';

// Contract addresses (from your deployment)
const ZKETHER_TOKEN_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as const;

// Simplified ABI for deposit/withdraw functions
const ZKETHER_TOKEN_ABI = [
  {
    inputs: [{ name: '_commitment', type: 'bytes32' }],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: '_amount', type: 'uint256' },
      { name: '_nullifierHash', type: 'bytes32' },
      { name: '_proof', type: 'bytes' },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_amount', type: 'uint256' }],
    name: 'calculateTDS',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface SwapQuote {
  ethAmount: string;
  zkethAmount: string;
  tdsAmount: string;
  netAmount: string;
  gasFee: string;
}

export interface SwapResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

class SwapService {
  /**
   * Get quote for ETH to zkETH swap
   */
  async getSwapQuote(ethAmount: string): Promise<SwapQuote> {
    try {
      const amountWei = parseEther(ethAmount);
      
      // Calculate TDS (1% deduction)
      const tdsAmount = await readContract(wagmiConfig, {
        address: ZKETHER_TOKEN_ADDRESS,
        abi: ZKETHER_TOKEN_ABI,
        functionName: 'calculateTDS',
        args: [amountWei],
      });
      
      const netAmount = amountWei - tdsAmount;
      
      // Estimate gas fee (simplified)
      const gasFee = '0.001'; // Fallback estimate

      return {
        ethAmount,
        zkethAmount: formatEther(netAmount),
        tdsAmount: formatEther(tdsAmount),
        netAmount: formatEther(netAmount),
        gasFee,
      };
    } catch (error) {
      console.error('Error getting swap quote:', error);
      throw error;
    }
  }

  /**
   * Swap ETH for zkETH (deposit)
   */
  async swapETHToZkETH(ethAmount: string): Promise<SwapResult> {
    try {
      // Check if on correct network
      const isOnAnvil = await networkService.isOnAnvil();
      if (!isOnAnvil) {
        throw new Error('Please switch to Anvil network first');
      }

      const account = getAccount(wagmiConfig);
      if (!account.address) {
        throw new Error('Wallet not connected');
      }

      const amountWei = parseEther(ethAmount);
      
      // Generate a simple commitment
      const commitment = keccak256(
        encodePacked(['address', 'uint256', 'uint256'], 
        [account.address, amountWei, BigInt(Date.now())])
      );

      // Execute deposit
      const txHash = await writeContract(wagmiConfig, {
        address: ZKETHER_TOKEN_ADDRESS,
        abi: ZKETHER_TOKEN_ABI,
        functionName: 'deposit',
        args: [commitment],
        value: amountWei,
      });

      return {
        success: true,
        txHash,
      };
    } catch (error: any) {
      console.error('Error swapping ETH to zkETH:', error);
      return {
        success: false,
        error: error.message || 'Swap failed',
      };
    }
  }

  /**
   * Swap zkETH for ETH (withdraw) - simplified version
   */
  async swapZkETHToETH(zkethAmount: string): Promise<SwapResult> {
    try {
      // Check if on correct network
      const isOnAnvil = await networkService.isOnAnvil();
      if (!isOnAnvil) {
        throw new Error('Please switch to Anvil network first');
      }

      const account = getAccount(wagmiConfig);
      if (!account.address) {
        throw new Error('Wallet not connected');
      }

      const amountWei = parseEther(zkethAmount);
      
      // Generate nullifier hash
      const nullifierHash = keccak256(
        encodePacked(['address', 'uint256', 'uint256'], 
        [account.address, amountWei, BigInt(Date.now())])
      );

      // Create dummy proof
      const dummyProof = '0x64756d6d795f70726f6f665f706c616365686f6c646572' as `0x${string}`;

      // Execute withdrawal
      const txHash = await writeContract(wagmiConfig, {
        address: ZKETHER_TOKEN_ADDRESS,
        abi: ZKETHER_TOKEN_ABI,
        functionName: 'withdraw',
        args: [amountWei, nullifierHash, dummyProof],
      });

      return {
        success: true,
        txHash,
      };
    } catch (error: any) {
      console.error('Error swapping zkETH to ETH:', error);
      return {
        success: false,
        error: error.message || 'Swap failed',
      };
    }
  }

  /**
   * Get zkETH balance for an address
   */
  async getZkETHBalance(address: `0x${string}`): Promise<string> {
    try {
      const balance = await readContract(wagmiConfig, {
        address: ZKETHER_TOKEN_ADDRESS,
        abi: ZKETHER_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      return formatEther(balance);
    } catch (error) {
      console.error('Error getting zkETH balance:', error);
      return '0.0';
    }
  }

  /**
   * Check if user has sufficient ETH balance
   */
  async checkETHBalance(address: `0x${string}`, requiredAmount: string): Promise<boolean> {
    try {
      const balance = await networkService.getBalance(address);
      const required = parseFloat(requiredAmount);
      const available = parseFloat(balance);
      
      // Add some buffer for gas fees
      return available >= (required + 0.01);
    } catch (error) {
      console.error('Error checking ETH balance:', error);
      return false;
    }
  }

  /**
   * Check if user has sufficient zkETH balance
   */
  async checkZkETHBalance(address: `0x${string}`, requiredAmount: string): Promise<boolean> {
    try {
      const balance = await this.getZkETHBalance(address);
      const required = parseFloat(requiredAmount);
      const available = parseFloat(balance);
      
      return available >= required;
    } catch (error) {
      console.error('Error checking zkETH balance:', error);
      return false;
    }
  }
}

export const swapService = new SwapService();
