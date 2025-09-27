import { createPublicClient, createWalletClient, http } from 'viem';
import { localhost } from 'viem/chains';

export interface ContractConfig {
  address: string;
  abi: any[];
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
}

class ContractService {
  private publicClient: any;
  private walletClient: any;
  private networkConfig: NetworkConfig;

  constructor() {
    this.networkConfig = {
      chainId: 31337,
      name: 'Anvil Local',
      rpcUrl: 'http://localhost:8545'
    };
    this.initializeClients();
  }

  private async initializeClients() {
    try {
      const anvilChain = {
        ...localhost,
        id: this.networkConfig.chainId,
        name: this.networkConfig.name
      };

      this.publicClient = createPublicClient({
        chain: anvilChain,
        transport: http(this.networkConfig.rpcUrl)
      });

      console.log('✅ Contract service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize contract service:', error);
    }
  }

  /**
   * Read from contract
   */
  async readContract(config: ContractConfig, functionName: string, args: any[] = []) {
    try {
      return await this.publicClient.readContract({
        address: config.address as `0x${string}`,
        abi: config.abi,
        functionName,
        args
      });
    } catch (error) {
      console.error(`❌ Failed to read from contract ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Write to contract (requires wallet)
   */
  async writeContract(
    config: ContractConfig, 
    functionName: string, 
    args: any[] = [],
    account?: string
  ) {
    try {
      if (!this.walletClient) {
        throw new Error('Wallet client not initialized');
      }

      const { request } = await this.publicClient.simulateContract({
        address: config.address as `0x${string}`,
        abi: config.abi,
        functionName,
        args,
        account: account as `0x${string}`
      });

      return await this.walletClient.writeContract(request);
    } catch (error) {
      console.error(`❌ Failed to write to contract ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return this.networkConfig;
  }

  /**
   * Check if connected to network
   */
  async isConnected(): Promise<boolean> {
    try {
      const blockNumber = await this.publicClient.getBlockNumber();
      return blockNumber > 0;
    } catch (error) {
      return false;
    }
  }
}

export const contractService = new ContractService();
