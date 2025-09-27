// Mock onchain ID service for development
export const onchainIdService = {
  generateOnchainId: async (kycData: any) => {
    // Mock implementation - in production this would interact with blockchain
    const mockId = `zketh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🔗 Generating onchain ID:', mockId);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      onchainId: mockId,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
      timestamp: new Date().toISOString()
    };
  },
  
  verifyOnchainId: async (onchainId: string) => {
    // Mock verification
    console.log('✅ Verifying onchain ID:', onchainId);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      isValid: true,
      verificationHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      timestamp: new Date().toISOString()
    };
  }
};
