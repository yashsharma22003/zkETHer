import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Alert } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';
import { Card, CardContent } from './ui/Card';
import DotMatrix from './ui/DotMatrix';
import Button from './ui/Button';
import { moproService } from '../services/moproService';
import { CircomProofResult } from '../../modules/mopro';

interface CircomProofScreenProps {
  onContinue: () => void;
}

export default function CircomProofScreen({ onContinue }: CircomProofScreenProps) {
  const [inputA, setInputA] = useState('3');
  const [inputB, setInputB] = useState('4');
  const [proofGenerated, setProofGenerated] = useState(false);
  const [proofValid, setProofValid] = useState<boolean | null>(null);
  const [publicSignals, setPublicSignals] = useState('');
  const [proof, setProof] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentProofResult, setCurrentProofResult] = useState<CircomProofResult | null>(null);
  
  // Mopro service state
  const [moproStatus, setMoproStatus] = useState('Initializing');
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [proofResult, setProofResult] = useState<CircomProofResult | null>(null);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);

  useEffect(() => {
    console.log('🚀 [CircomProofScreen] Component mounted, initializing mopro...');
    initializeMopro();
  }, []);

  const initializeMopro = async () => {
    try {
      console.log('🔧 [CircomProofScreen] Starting mopro initialization process...');
      setIsInitializing(true);
      setInitError(null);
      
      // Test basic mopro functionality
      console.log('👋 [CircomProofScreen] Testing mopro hello function...');
      const helloResult = moproService.testHello();
      console.log('✅ [CircomProofScreen] Mopro hello test result:', helloResult);
      
      // Initialize the service
      console.log('💾 [CircomProofScreen] Initializing mopro service (loading assets)...');
      await moproService.initialize();
      
      console.log('🎉 [CircomProofScreen] Mopro initialization completed successfully!');
      setMoproStatus('Ready');
      setIsInitialized(true);
    } catch (error) {
      console.error('💥 [CircomProofScreen] Mopro initialization failed:', error);
      console.error('🔍 [CircomProofScreen] Initialization error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      setInitError(error instanceof Error ? error.message : 'Unknown error');
      setMoproStatus('Failed');
    } finally {
      setIsInitializing(false);
      console.log('🏁 [CircomProofScreen] Initialization process completed');
    }
  };

  const handleGenerateProof = async () => {
    console.log('🔄 [CircomProofScreen] Generate proof button pressed');
    console.log('📊 [CircomProofScreen] Current state:', {
      isInitialized,
      inputA: inputA.trim(),
      inputB: inputB.trim(),
      moproStatus
    });
    
    if (!isInitialized) {
      console.log('⚠️ [CircomProofScreen] Cannot generate proof - mopro not initialized');
      Alert.alert('Error', 'Mopro is not initialized yet');
      return;
    }

    if (!inputA.trim() || !inputB.trim()) {
      console.log('⚠️ [CircomProofScreen] Cannot generate proof - missing inputs');
      Alert.alert('Error', 'Please enter values for both inputs');
      return;
    }

    try {
      console.log('🚀 [CircomProofScreen] Starting proof generation process...');
      console.log('📊 [CircomProofScreen] Inputs:', { a: inputA, b: inputB });
      console.log('🧮 [CircomProofScreen] Expected result (a*b):', parseInt(inputA) * parseInt(inputB));
      
      setIsGenerating(true);
      setGenerateError(null);
      
      const startTime = Date.now();
      const result = await moproService.generateMultiplicationProof(inputA, inputB);
      const endTime = Date.now();
      
      console.log('🎉 [CircomProofScreen] Proof generation completed!');
      console.log('⏱️ [CircomProofScreen] Total time (including UI):', endTime - startTime, 'ms');
      console.log('📋 [CircomProofScreen] Proof result received:', {
        hasProof: !!result.proof,
        hasInputs: !!result.inputs,
        inputsCount: result.inputs?.length
      });
      
      setProofResult(result);
      setCurrentProofResult(result);
      setProofGenerated(true);
      
      const formatted = moproService.formatProofForDisplay(result);
      setProof(formatted.proof);
      setPublicSignals(formatted.publicSignals);
      
      console.log('✅ [CircomProofScreen] UI updated with proof data');
      Alert.alert('Success', 'Proof generated successfully!');
    } catch (error) {
      console.error('💥 [CircomProofScreen] Proof generation failed:', error);
      console.error('🔍 [CircomProofScreen] Generation error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        inputs: { a: inputA, b: inputB }
      });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setGenerateError(errorMessage);
      Alert.alert('Error', `Failed to generate proof: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
      setIsLoading(false);
      console.log('🏁 [CircomProofScreen] Proof generation process completed');
    }
  };

  const handleVerifyProof = async () => {
    console.log('🔍 [CircomProofScreen] Verify proof button pressed');
    console.log('📊 [CircomProofScreen] Verification state:', {
      hasProofResult: !!proofResult,
      proofInputs: proofResult?.inputs,
      isInitialized
    });
    
    if (!proofResult && !currentProofResult) {
      console.log('⚠️ [CircomProofScreen] Cannot verify - no proof available');
      Alert.alert('Error', 'No proof to verify. Generate a proof first.');
      return;
    }

    try {
      console.log('🚀 [CircomProofScreen] Starting proof verification process...');
      const proofToVerifyForLog = proofResult || currentProofResult;
      console.log('📋 [CircomProofScreen] Proof to verify:', {
        inputs: proofToVerifyForLog?.inputs,
        proofStructure: {
          hasA: !!proofToVerifyForLog?.proof?.a,
          hasB: !!proofToVerifyForLog?.proof?.b,
          hasC: !!proofToVerifyForLog?.proof?.c
        }
      });
      
      setIsVerifying(true);
      setVerifyError(null);
      
      const startTime = Date.now();
      const proofToVerify = proofResult || currentProofResult;
      const isValid = await moproService.verifyProof(proofToVerify!);
      const endTime = Date.now();
      
      console.log('🎉 [CircomProofScreen] Proof verification completed!');
      console.log('⏱️ [CircomProofScreen] Verification time (including UI):', endTime - startTime, 'ms');
      console.log('🎯 [CircomProofScreen] Verification result:', isValid ? 'VALID' : 'INVALID');
      
      setVerificationResult(isValid);
      setProofValid(isValid);
      
      console.log('✅ [CircomProofScreen] UI updated with verification result');
      Alert.alert(
        'Verification Result',
        isValid ? 'Proof is valid!' : 'Proof is invalid!'
      );
    } catch (error) {
      console.error('💥 [CircomProofScreen] Proof verification failed:', error);
      console.error('🔍 [CircomProofScreen] Verification error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        proofInputs: (proofResult || currentProofResult)?.inputs
      });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setVerifyError(errorMessage);
      Alert.alert('Error', `Failed to verify proof: ${errorMessage}`);
    } finally {
      setIsVerifying(false);
      setIsLoading(false);
      console.log('🏁 [CircomProofScreen] Proof verification process completed');
    }
  };

  const handleContinue = () => {
    console.log('➡️ [CircomProofScreen] Continue button pressed - moving to next onboarding step');
    console.log('📊 [CircomProofScreen] Final state summary:', {
      moproStatus,
      isInitialized,
      hasGeneratedProof: !!proofResult || !!currentProofResult,
      verificationResult,
      inputsUsed: { a: inputA, b: inputB }
    });
    onContinue();
  };

  return (
    <View style={globalStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <DotMatrix pattern="header" size="medium" />
              <Text style={styles.title}>Circom Proof Generator</Text>
              <DotMatrix pattern="header" size="medium" />
            </View>
          </View>

          {/* Input Fields Card */}
          <Card style={styles.inputCard}>
            <CardContent>
              <Text style={styles.sectionTitle}>Circuit Inputs</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>a</Text>
                <TextInput
                  style={styles.input}
                  value={inputA}
                  onChangeText={setInputA}
                  keyboardType="numeric"
                  placeholder="Enter value for a"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>b</Text>
                <TextInput
                  style={styles.input}
                  value={inputB}
                  onChangeText={setInputB}
                  keyboardType="numeric"
                  placeholder="Enter value for b"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.generateButton, (isLoading || !isInitialized) && styles.disabledButton]}
              onPress={handleGenerateProof}
              disabled={isLoading || isGenerating || !isInitialized}
            >
              <Text style={[styles.buttonText, (isLoading || !isInitialized) && styles.disabledText]}>
                {isGenerating ? 'GENERATING...' : 'GENERATE CIRCOM PROOF'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.verifyButton, (!proofGenerated || isLoading) && styles.disabledButton]}
              onPress={handleVerifyProof}
              disabled={!proofGenerated || isLoading || isVerifying}
            >
              <Text style={[styles.buttonText, (!proofGenerated || isLoading) && styles.disabledText]}>
                {isVerifying ? 'VERIFYING...' : 'VERIFY CIRCOM PROOF'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Initialization Status */}
          <Card style={styles.resultCard}>
            <CardContent>
              <Text style={styles.resultTitle}>Mopro Status:</Text>
              <Text style={[styles.resultValue, isInitialized ? styles.validText : styles.invalidText]}>
                {isInitializing ? 'Initializing...' : moproStatus}
              </Text>
            </CardContent>
          </Card>

          {/* Proof Results */}
          {proofGenerated && (
            <>
              {/* Proof Validity */}
              <Card style={styles.resultCard}>
                <CardContent>
                  <Text style={styles.resultTitle}>Proof is Valid:</Text>
                  <Text style={[styles.resultValue, proofValid === null ? styles.pendingText : proofValid ? styles.validText : styles.invalidText]}>
                    {proofValid === null ? 'Not verified yet' : proofValid ? 'true' : 'false'}
                  </Text>
                </CardContent>
              </Card>

              {/* Public Signals */}
              <Card style={styles.resultCard}>
                <CardContent>
                  <Text style={styles.resultTitle}>Public Signals:</Text>
                  <View style={styles.codeBlock}>
                    <Text style={styles.codeText}>{publicSignals}</Text>
                  </View>
                </CardContent>
              </Card>

              {/* Proof Data */}
              <Card style={styles.resultCard}>
                <CardContent>
                  <Text style={styles.resultTitle}>Proof:</Text>
                  <View style={styles.codeBlock}>
                    <Text style={styles.codeText} numberOfLines={8} ellipsizeMode="tail">
                      {proof}
                    </Text>
                  </View>
                </CardContent>
              </Card>
            </>
          )}

          {/* Continue Button */}
          <View style={styles.continueSection}>
            <DotMatrix pattern="header" size="small" />
            <Button
              title="Continue to zkETHer"
              onPress={handleContinue}
              style={styles.continueButton}
            />
            <Text style={styles.continueHint}>
              Ready to explore zero-knowledge privacy?
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  
  // Header Styles
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'monospace',
    letterSpacing: 1,
    textAlign: 'center',
  },

  // Input Card Styles
  inputCard: {
    marginBottom: 24,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 8,
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },

  // Button Styles
  buttonGroup: {
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButton: {
    backgroundColor: colors.accent,
  },
  verifyButton: {
    backgroundColor: colors.accent,
    opacity: 0.9,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  disabledText: {
    opacity: 0.5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pendingText: {
    color: colors.text.secondary,
  },

  // Result Card Styles
  resultCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  resultValue: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  validText: {
    color: colors.accent,
  },
  invalidText: {
    color: colors.error,
  },
  codeBlock: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
  },
  codeText: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
    lineHeight: 16,
  },

  // Continue Section Styles
  continueSection: {
    marginTop: 32,
    alignItems: 'center',
    gap: 16,
  },
  continueButton: {
    minWidth: 200,
  },
  continueHint: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});
