/**
 * Mock Sandbox API Service for zkETHer Protocol
 * Returns success responses for all 4 verification types:
 * 1. Aadhaar Verification
 * 2. PAN Verification  
 * 3. Face Match Verification
 * 4. zkETHer Eligibility
 */

export interface AadhaarData {
  status: string;
  data: {
    name: string;
    aadhaar: string;
    dob?: string;
    address?: string;
  };
}

export interface PANData {
  status: string;
  data: {
    pan: string;
    name: string;
    dob?: string;
    father_name?: string;
  };
}

export interface FaceMatchData {
  status: string;
  data: {
    match: boolean;
    confidence: number;
  };
}

export interface zkETHerEligibilityData {
  status: string;
  data: {
    eligible: boolean;
    onchainId?: string;
    claims: string[];
  };
}

export interface VerificationResponse {
  verification_id: string;
  status: string;
  timestamp: number;
  verification_type: string;
  confidence_score: number;
  data: any;
}

class MockSandboxApiService {
  private baseUrl: string;
  private apiKey: string;
  private isTestMode: boolean;

  constructor(isTestMode: boolean = true) {
    this.isTestMode = isTestMode;
    this.baseUrl = isTestMode 
      ? 'https://test-api.sandbox.co.in' 
      : 'https://api.sandbox.co.in';
    this.apiKey = 'key_live_3c553cdc734145b298239cb84ce7e147';
  }

  /**
   * Mock Aadhaar verification - always returns success
   */
  async verifyAadhaar(aadhaarNumber: string, name: string): Promise<AadhaarData> {
    // Simulate API delay
    await this.delay(1500);
    
    return {
      status: 'success',
      data: {
        name: name.toUpperCase(),
        aadhaar: aadhaarNumber,
        dob: '1990-01-01',
        address: 'Mock Address, India'
      }
    };
  }

  /**
   * Mock PAN verification - always returns success
   */
  async verifyPAN(panNumber: string, name: string): Promise<PANData> {
    // Simulate API delay
    await this.delay(1500);
    
    return {
      status: 'success',
      data: {
        pan: panNumber.toUpperCase(),
        name: name.toUpperCase(),
        dob: '1990-01-01',
        father_name: 'MOCK FATHER NAME'
      }
    };
  }

  /**
   * Mock face match verification - always returns success
   */
  async verifyFaceMatch(aadhaarPhoto: string, selfieImage: string): Promise<FaceMatchData> {
    // Simulate API delay
    await this.delay(2000);
    
    return {
      status: 'success',
      data: {
        match: true,
        confidence: 0.95
      }
    };
  }

  /**
   * Mock zkETHer eligibility check - always returns success
   */
  async checkzkETHerEligibility(userAddress: string): Promise<zkETHerEligibilityData> {
    // Simulate API delay
    await this.delay(1000);
    
    return {
      status: 'success',
      data: {
        eligible: true,
        claims: ['aadhaar_verified', 'pan_verified', 'face_matched', 'zkether_eligible']
      }
    };
  }

  /**
   * Batch verification - processes all verifications and returns success for all
   */
  async batchVerification(data: {
    aadhaarNumber: string;
    panNumber: string;
    name: string;
    aadhaarPhoto: string;
    selfieImage: string;
    userAddress: string;
  }): Promise<{
    aadhaar: AadhaarData;
    pan: PANData;
    faceMatch: FaceMatchData;
    zkETHerEligibility: zkETHerEligibilityData;
    allVerified: boolean;
  }> {
    console.log('🎯 Starting batch verification with mock responses...');
    
    // Run all verifications in parallel
    const [aadhaar, pan, faceMatch, zkETHerEligibility] = await Promise.all([
      this.verifyAadhaar(data.aadhaarNumber, data.name),
      this.verifyPAN(data.panNumber, data.name),
      this.verifyFaceMatch(data.aadhaarPhoto, data.selfieImage),
      this.checkzkETHerEligibility(data.userAddress)
    ]);

    const allVerified = 
      aadhaar.status === 'success' &&
      pan.status === 'success' &&
      faceMatch.status === 'success' &&
      zkETHerEligibility.status === 'success';

    console.log('✅ Batch verification completed - All verifications passed!');

    return {
      aadhaar,
      pan,
      faceMatch,
      zkETHerEligibility,
      allVerified
    };
  }

  /**
   * Generate mock verification response
   */
  private generateMockResponse(verificationType: string, data: any): VerificationResponse {
    return {
      verification_id: `mock_${verificationType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'success',
      timestamp: Date.now(),
      verification_type: verificationType,
      confidence_score: 9500, // 95% confidence
      data
    };
  }

  /**
   * Simulate API delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get verification status (always returns success for mock)
   */
  async getVerificationStatus(verificationId: string): Promise<VerificationResponse> {
    await this.delay(500);
    
    return {
      verification_id: verificationId,
      status: 'success',
      timestamp: Date.now(),
      verification_type: 'status_check',
      confidence_score: 10000, // 100% confidence
      data: { verified: true }
    };
  }

  /**
   * Check if service is in test mode
   */
  isTestEnvironment(): boolean {
    return this.isTestMode;
  }

  /**
   * Get current API configuration
   */
  getConfig() {
    return {
      baseUrl: this.baseUrl,
      isTestMode: this.isTestMode,
      environment: this.isTestMode ? 'test' : 'production'
    };
  }
}

// Export singleton instance
export const sandboxApiService = new MockSandboxApiService(true);
export default sandboxApiService;
