import { zkETHerProtocol, VerificationInput, VerificationOutput } from './zkETHerProtocol';
import { secureKeyService } from './secureKeyService';

export interface OnchainIDData {
  address: string;
  claims: string[];
  isVerified: boolean;
  createdAt: string;
}

export interface ClaimData {
  topic: number;
  issuer: string;
  data: string;
  signature: string;
}

class OnchainIdService {
  /**
   * Create OnchainID and issue claims based on KYC verification
   */
  async createOnchainIDWithClaims(
    userAddress: string,
    kycData: {
      aadhaarData: any;
      panData: any;
      faceMatchData: any;
    }
  ): Promise<OnchainIDData> {
    try {
      console.log('🆔 Creating OnchainID for user:', userAddress);

      // Prepare verification input for zkETHer protocol
      const verificationInput: VerificationInput = {
        userAddress,
        aadhaarData: kycData.aadhaarData,
        panData: kycData.panData,
        faceMatchData: kycData.faceMatchData
      };

      // Process KYC verification through zkETHer protocol
      const result: VerificationOutput = await zkETHerProtocol.processKYCVerification(verificationInput);

      console.log('✅ OnchainID created:', result.onchainID);

      return {
        address: result.onchainID,
        claims: result.claims,
        isVerified: result.isVerified,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to create OnchainID:', error);
      throw new Error(`OnchainID creation failed: ${error}`);
    }
  }

  /**
   * Verify if user has valid claims for zkETHer eligibility
   */
  async verifyEligibility(onchainId: string): Promise<boolean> {
    try {
      // This would check the actual contract for claims
      // For now, we'll use the protocol service
      return zkETHerProtocol.isReady();
    } catch (error) {
      console.error('❌ Failed to verify eligibility:', error);
      return false;
    }
  }

  /**
   * Get user's OnchainID address
   */
  async getUserOnchainID(userAddress: string): Promise<string | null> {
    try {
      // This would query the contract for user's OnchainID
      // Implementation depends on the deployed contract structure
      return null; // Placeholder
    } catch (error) {
      console.error('❌ Failed to get user OnchainID:', error);
      return null;
    }
  }

  /**
   * Get all claims for an OnchainID
   */
  async getClaims(onchainId: string): Promise<ClaimData[]> {
    try {
      // This would query the contract for all claims
      // Implementation depends on the deployed contract structure
      return []; // Placeholder
    } catch (error) {
      console.error('❌ Failed to get claims:', error);
      return [];
    }
  }

  /**
   * Generate secure keys and link to OnchainID
   */
  async generateSecureKeys(onchainId: string) {
    try {
      console.log('🔐 Generating secure keys for OnchainID:', onchainId);
      
      const keyInfo = await secureKeyService.generateAndStoreKeys(onchainId);
      
      console.log('✅ Secure keys generated and linked to OnchainID');
      return keyInfo;
    } catch (error) {
      console.error('❌ Failed to generate secure keys:', error);
      throw error;
    }
  }

  /**
   * Get contract addresses for debugging
   */
  getContractInfo() {
    return zkETHerProtocol.getContractAddresses();
  }
}

export const onchainIdService = new OnchainIdService();
