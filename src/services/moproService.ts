import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { 
  generateCircomProof, 
  verifyCircomProof, 
  ProofLibOption, 
  CircomProofLib, 
  CircomProofResult,
  hello
} from '../../modules/mopro';

export class MoproService {
  private static instance: MoproService;
  private zkeyPath: string | null = null;

  private constructor() {}

  public static getInstance(): MoproService {
    if (!MoproService.instance) {
      MoproService.instance = new MoproService();
    }
    return MoproService.instance;
  }

  /**
   * Initialize the service by loading circuit assets
   */
  public async initialize(): Promise<void> {
    try {
      console.log('🔧 [MoproService] Starting initialization...');
      
      // Use the same approach as working react-native-app
      const newFileName = "multiplier2_final.zkey";
      const asset = Asset.fromModule(require('../../assets/keys/multiplier2_final.zkey'));
      const newFilePath = `${FileSystem.documentDirectory}${newFileName}`;
      
      console.log('📁 [MoproService] Target file path:', newFilePath);
      
      // Check if file already exists
      const fileInfo = await FileSystem.getInfoAsync(newFilePath);
      if (!fileInfo.exists) {
        console.log('⬇️ [MoproService] File does not exist, downloading asset...');
        const file = await asset.downloadAsync();
        if (file.localUri === null) {
          throw new Error("Failed to download the file");
        }
        try {
          console.log('📋 [MoproService] Moving file from', file.localUri, 'to', newFilePath);
          await FileSystem.moveAsync({
            from: file.localUri,
            to: newFilePath,
          });
        } catch (error) {
          console.error("Error moving the file:", error);
          throw error;
        }
      } else {
        console.log('✅ [MoproService] File already exists at target location');
      }
      
      // Set the path without file:// prefix, exactly like working app
      this.zkeyPath = newFilePath.replace("file://", "");
      
      console.log('✅ [MoproService] Successfully initialized!');
      console.log('📍 [MoproService] Zkey path:', this.zkeyPath);
      console.log('📊 [MoproService] Asset details:', {
        uri: asset.uri,
        localUri: asset.localUri,
        downloaded: asset.downloaded
      });
    } catch (error) {
      console.error('💥 [MoproService] Initialization failed:', error);
      console.error('🔍 [MoproService] Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      throw error;
    }
  }

  /**
   * Test basic mopro functionality
   */
  public testHello(): string {
    try {
      console.log('👋 [MoproService] Testing mopro hello function...');
      const result = hello();
      console.log('✅ [MoproService] Hello test successful! Result:', result);
      return result;
    } catch (error) {
      console.error('❌ [MoproService] Hello test failed:', error);
      console.error('🔍 [MoproService] Hello error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      throw error;
    }
  }

  /**
   * Generate a Circom proof for multiplication circuit
   */
  public async generateMultiplicationProof(a: string, b: string): Promise<CircomProofResult> {
    if (!this.zkeyPath) {
      console.error('❌ [MoproService] Service not initialized!');
      throw new Error('MoproService not initialized. Call initialize() first.');
    }

    try {
      const startTime = Date.now();
      console.log('🔄 [MoproService] Starting proof generation...');
      
      const circuitInputs = {
        a: [a],
        b: [b]
      };

      const proofLib: CircomProofLib = {
        proofLib: ProofLibOption.Arkworks
      };

      console.log('📊 [MoproService] Proof generation parameters:');
      console.log('  - Inputs:', circuitInputs);
      console.log('  - Expected output (a*b):', parseInt(a) * parseInt(b));
      console.log('  - Zkey path:', this.zkeyPath);
      console.log('  - Proof library:', 'Arkworks');
      console.log('  - Input JSON:', JSON.stringify(circuitInputs));

      console.log('⚡ [MoproService] Calling generateCircomProof...');
      const result = await generateCircomProof(
        this.zkeyPath,
        JSON.stringify(circuitInputs),
        proofLib
      );

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('🎉 [MoproService] Proof generated successfully!');
      console.log('⏱️ [MoproService] Generation time:', duration, 'ms');
      console.log('📋 [MoproService] Proof result structure:', {
        hasProof: !!result.proof,
        hasInputs: !!result.inputs,
        inputsLength: result.inputs?.length,
        proofKeys: result.proof ? Object.keys(result.proof) : []
      });
      console.log('🔢 [MoproService] Public inputs:', result.inputs);
      console.log('🔐 [MoproService] Full proof object:', JSON.stringify(result, null, 2));
      
      return result;
    } catch (error) {
      console.error('💥 [MoproService] Proof generation failed!');
      console.error('🔍 [MoproService] Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        inputs: { a, b },
        zkeyPath: this.zkeyPath
      });
      throw error;
    }
  }

  /**
   * Verify a Circom proof
   */
  public async verifyProof(proofResult: CircomProofResult): Promise<boolean> {
    if (!this.zkeyPath) {
      console.error('❌ [MoproService] Service not initialized for verification!');
      throw new Error('MoproService not initialized. Call initialize() first.');
    }

    try {
      const startTime = Date.now();
      console.log('🔍 [MoproService] Starting proof verification...');
      
      const proofLib: CircomProofLib = {
        proofLib: ProofLibOption.Arkworks
      };

      console.log('📊 [MoproService] Verification parameters:');
      console.log('  - Zkey path:', this.zkeyPath);
      console.log('  - Proof library:', 'Arkworks');
      console.log('  - Public inputs:', proofResult.inputs);
      console.log('  - Proof structure:', {
        hasA: !!proofResult.proof?.a,
        hasB: !!proofResult.proof?.b,
        hasC: !!proofResult.proof?.c,
        protocol: proofResult.proof?.protocol,
        curve: proofResult.proof?.curve
      });

      console.log('⚡ [MoproService] Calling verifyCircomProof...');
      const isValid = await verifyCircomProof(
        this.zkeyPath,
        proofResult,
        proofLib
      );

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('🎯 [MoproService] Verification completed!');
      console.log('⏱️ [MoproService] Verification time:', duration, 'ms');
      console.log('✅ [MoproService] Verification result:', isValid ? 'VALID' : 'INVALID');
      
      if (isValid) {
        console.log('🎉 [MoproService] Proof is cryptographically valid!');
      } else {
        console.log('⚠️ [MoproService] Proof verification failed - proof is invalid!');
      }
      
      return isValid;
    } catch (error) {
      console.error('💥 [MoproService] Proof verification failed!');
      console.error('🔍 [MoproService] Verification error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        proofInputs: proofResult?.inputs,
        zkeyPath: this.zkeyPath
      });
      throw error;
    }
  }

  /**
   * Get formatted proof data for display
   */
  public formatProofForDisplay(proofResult: CircomProofResult): {
    publicSignals: string;
    proof: string;
  } {
    console.log('📝 [MoproService] Formatting proof for display...');
    
    const formatted = {
      publicSignals: JSON.stringify(proofResult.inputs),
      proof: JSON.stringify(proofResult.proof, null, 2)
    };
    
    console.log('📊 [MoproService] Formatted data lengths:', {
      publicSignalsLength: formatted.publicSignals.length,
      proofLength: formatted.proof.length
    });
    
    return formatted;
  }
}

export const moproService = MoproService.getInstance();
