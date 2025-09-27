import { createPublicClient, http } from 'viem';
import { localhost } from 'viem/chains';
import { DEPLOYED_CONTRACTS } from '../config/deployedContracts';

export class ContractVerification {
  private client;

  constructor() {
    this.client = createPublicClient({
      chain: localhost,
      transport: http(DEPLOYED_CONTRACTS.anvil.RPC_URL)
    });
  }

  /**
   * Verify all contracts are deployed and accessible
   */
  async verifyDeployment(): Promise<{
    claimIssuer: boolean;
    zkETHerToken: boolean;
    networkConnected: boolean;
  }> {
    try {
      console.log('🔍 Verifying contract deployment...');

      // Check network connection
      const blockNumber = await this.client.getBlockNumber();
      const networkConnected = blockNumber > 0;

      // Check ClaimIssuer contract
      const claimIssuerCode = await this.client.getBytecode({
        address: DEPLOYED_CONTRACTS.anvil.CLAIM_ISSUER as `0x${string}`
      });
      const claimIssuer = claimIssuerCode !== undefined && claimIssuerCode !== '0x';

      // Check zkETHer Token contract
      const tokenCode = await this.client.getBytecode({
        address: DEPLOYED_CONTRACTS.anvil.ZKETHER_TOKEN as `0x${string}`
      });
      const zkETHerToken = tokenCode !== undefined && tokenCode !== '0x';

      const result = {
        claimIssuer,
        zkETHerToken,
        networkConnected
      };

      console.log('✅ Contract verification complete:', result);
      return result;

    } catch (error) {
      console.error('❌ Contract verification failed:', error);
      return {
        claimIssuer: false,
        zkETHerToken: false,
        networkConnected: false
      };
    }
  }

  /**
   * Get contract deployment info
   */
  async getDeploymentInfo() {
    try {
      const blockNumber = await this.client.getBlockNumber();
      
      return {
        network: 'Anvil Local',
        chainId: DEPLOYED_CONTRACTS.anvil.CHAIN_ID,
        rpcUrl: DEPLOYED_CONTRACTS.anvil.RPC_URL,
        currentBlock: blockNumber.toString(),
        contracts: {
          claimIssuer: DEPLOYED_CONTRACTS.anvil.CLAIM_ISSUER,
          zkETHerToken: DEPLOYED_CONTRACTS.anvil.ZKETHER_TOKEN
        }
      };
    } catch (error) {
      console.error('❌ Failed to get deployment info:', error);
      return null;
    }
  }
}

export const contractVerification = new ContractVerification();
