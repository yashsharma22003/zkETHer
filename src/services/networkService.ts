import { formatEther } from 'viem';
import { switchChain, getChainId, getBalance } from '@wagmi/core';
import { wagmiConfig } from '../config/walletConnect';

export const ANVIL_CHAIN_ID = 31337;
export const SEPOLIA_CHAIN_ID = 11155111;

class NetworkService {
  async getCurrentChainId(): Promise<number> {
    try {
      return getChainId(wagmiConfig);
    } catch (error) {
      console.error('Error getting current chain:', error);
      return 1; // Default to mainnet
    }
  }

  async switchToAnvil(): Promise<boolean> {
    try {
      await switchChain(wagmiConfig, { chainId: ANVIL_CHAIN_ID });
      return true;
    } catch (error) {
      console.error('Error switching to Anvil:', error);
      return false;
    }
  }

  async switchToSepolia(): Promise<boolean> {
    try {
      await switchChain(wagmiConfig, { chainId: SEPOLIA_CHAIN_ID });
      return true;
    } catch (error) {
      console.error('Error switching to Sepolia:', error);
      return false;
    }
  }

  async isOnAnvil(): Promise<boolean> {
    try {
      const chainId = await this.getCurrentChainId();
      return chainId === ANVIL_CHAIN_ID;
    } catch {
      return false;
    }
  }

  async isOnSepolia(): Promise<boolean> {
    try {
      const chainId = await this.getCurrentChainId();
      return chainId === SEPOLIA_CHAIN_ID;
    } catch {
      return false;
    }
  }

  getNetworkName(chainId: number): string {
    switch (chainId) {
      case 1:
        return 'Ethereum Mainnet';
      case 11155111:
        return 'Sepolia Testnet';
      case 31337:
        return 'Anvil Local';
      default:
        return 'Unknown Network';
    }
  }

  async getBalance(address: `0x${string}`): Promise<string> {
    try {
      const balance = await getBalance(wagmiConfig, { address });
      return formatEther(balance.value);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0.0';
    }
  }
}

export const networkService = new NetworkService();
