import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { globalStyles } from '../../styles/globalStyles';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { secureKeyService } from '../../services/secureKeyService';

export default function GeneratePrivacyKeysScreen() {
  const { setCurrentStep, kycData } = useOnboarding();
  const [step, setStep] = useState<'explanation' | 'generating' | 'complete'>('explanation');
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [generatedKeys, setGeneratedKeys] = useState<{
    publicKey: string;
    keyId: string;
    createdAt: string;
  } | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  
  // Create animated values for the 5x4 grid (20 dots like PWA)
  const animatedValues = useRef(
    Array.from({ length: 20 }, () => new Animated.Value(0))
  ).current;
  
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const goBack = () => {
    setCurrentStep('kyc' as any);
  };
  
  const nextStep = () => {
    setCurrentStep('complete' as any);
  };

  const generationSteps = [
    { name: "Random Entropy Generated", status: "pending" },
    { name: "Private Key Created", status: "pending" },
    { name: "Public Key Deriving...", status: "pending" },
    { name: "Secure Storage", status: "pending" }
  ];

  const getCurrentStepStatus = (index: number) => {
    if (progress < 25) return index === 0 ? "current" : index < 0 ? "completed" : "pending";
    if (progress < 50) return index === 1 ? "current" : index < 1 ? "completed" : "pending";
    if (progress < 75) return index === 2 ? "current" : index < 2 ? "completed" : "pending";
    return index === 3 ? "current" : index < 3 ? "completed" : "pending";
  };

  // Start PWA-style dot animations (5x4 grid = 20 dots)
  useEffect(() => {
    if (step === 'generating') {
      const animations = animatedValues.map((animatedValue, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: false,
            }),
            Animated.timing(animatedValue, {
              toValue: 0.4,
              duration: 1500,
              useNativeDriver: false,
            }),
          ]),
          { iterations: -1 }
        );
      });

      // Start animations with staggered delays like PWA
      animations.forEach((animation, index) => {
        setTimeout(() => {
          animation.start();
        }, index * 100);
      });

      return () => {
        animations.forEach(animation => animation.stop());
      };
    }
  }, [step]);

  const handleGenerate = async () => {
    setStep('generating');
    setProgress(0);
    setTimeRemaining(Math.floor((100) / 30));
    
    // Clear any existing intervals
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    
    try {
      // Start progress animation
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            return prev; // Stop at 90% until real generation completes
          }
          return prev + Math.random() * 15;
        });
      }, 200);
      
      timeIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => Math.max(1, Math.floor((100 - progress) / 30)));
      }, 1000);
      
      // Actually generate keys
      const onchainId = (kycData as any)?.extractedData?.onchainId;
      const keyInfo = await secureKeyService.generateAndStoreKeys(onchainId);
      
      // Complete progress
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
      
      setProgress(100);
      setGeneratedKeys(keyInfo);
      setStep('complete');
      
    } catch (error) {
      console.error('❌ Failed to generate keys:', error);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
      Alert.alert('Error', 'Failed to generate secure keys. Please try again.');
      setStep('explanation');
    }
  };

  const handleBackupLater = () => {
    nextStep();
  };

  const handleClearKeys = async () => {
    try {
      await secureKeyService.deleteKeys();
      console.log('🗑️ Keys cleared successfully - ready for fresh generation');
      Alert.alert('Keys Cleared', 'All keys have been deleted. You can now test key generation from scratch.');
    } catch (error) {
      console.error('❌ Failed to clear keys:', error);
      Alert.alert('Error', 'Failed to clear keys');
    }
  };

  // PWA-style 5x4 grid animated dots (20 dots total)
  const renderPWAAnimatedGrid = () => {
    return (
      <View style={styles.pwaAnimatedGrid}>
        {Array.from({ length: 20 }).map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.pwaDot,
              {
                opacity: animatedValues[i]?.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1],
                }) || 0.4,
                transform: [{
                  scale: animatedValues[i]?.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }) || 1,
                }],
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const handleShowPrivateKey = async () => {
    try {
      if (showPrivateKey) {
        setShowPrivateKey(false);
        setPrivateKey(null);
      } else {
        const key = await secureKeyService.getPrivateKey();
        if (key) {
          setPrivateKey(key);
          setShowPrivateKey(true);
        } else {
          Alert.alert('Authentication Required', 'Please authenticate to view private key');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to retrieve private key');
    }
  };

  const blurPrivateKey = (key: string) => {
    if (!key) return '';
    const start = key.slice(0, 6);
    const end = key.slice(-4);
    return `${start}${'•'.repeat(20)}${end}`;
  };

  if (step === 'complete') {
    return (
      <View style={globalStyles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Keys Generated Successfully!</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.successIcon}>🔐</Text>
          <Text style={styles.successTitle}>Privacy Keys Created</Text>
          <Text style={styles.successSubtitle}>
            Your zkETHer keys have been securely generated and stored on your device
          </Text>

          {generatedKeys && (
            <Card style={styles.keysCard}>
              <CardContent>
                <View style={styles.keySection}>
                  <Text style={styles.keyLabel}>Public Key:</Text>
                  <Text style={styles.publicKeyText}>
                    {generatedKeys.publicKey.slice(0, 10)}...{generatedKeys.publicKey.slice(-8)}
                  </Text>
                </View>

                <View style={styles.keySection}>
                  <Text style={styles.keyLabel}>Private Key:</Text>
                  <TouchableOpacity onPress={handleShowPrivateKey}>
                    <Text style={styles.privateKeyText}>
                      {showPrivateKey && privateKey ? 
                        blurPrivateKey(privateKey) : 
                        '••••••••••••••••••••••••'
                      }
                    </Text>
                    <Text style={styles.tapToReveal}>
                      {showPrivateKey ? '(Tap to hide)' : '(Tap to reveal - requires authentication)'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.keySection}>
                  <Text style={styles.keyLabel}>Key ID:</Text>
                  <Text style={styles.keyIdText}>{generatedKeys.keyId.slice(0, 16)}...</Text>
                </View>
              </CardContent>
            </Card>
          )}

          <Card style={styles.warningCard}>
            <CardContent>
              <View style={styles.warningHeader}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningTitle}>Keep these keys safe!</Text>
              </View>
              <Text style={styles.warningText}>• Keys are stored securely on your device</Text>
              <Text style={styles.warningText}>• Private key requires biometric authentication</Text>
              <Text style={styles.warningText}>• Lost keys = lost funds</Text>
            </CardContent>
          </Card>

          <Button
            title="CONTINUE TO APP"
            onPress={nextStep}
            style={styles.continueButton}
          />
        </View>
      </View>
    );
  }

  if (step === 'generating') {
    return (
      <View style={globalStyles.container}>
        <View style={styles.generatingContainer}>
          <View style={styles.generatingContent}>
            <Text style={styles.generatingTitle}>Generating Privacy Keys...</Text>
            
            {/* PWA-style Animated Grid */}
            {renderPWAAnimatedGrid()}
            
            <Text style={styles.progressText}>
              Progress: <Text style={styles.progressPercentage}>{Math.round(progress)}% Complete</Text>
            </Text>

            {/* PWA-style Progress Card with Grid */}
            <Card style={styles.progressCard}>
              <CardContent>
                {renderPWAAnimatedGrid()}
              </CardContent>
            </Card>

            {/* Generation Steps */}
            <View style={styles.generationSteps}>
              <Text style={styles.currentStepTitle}>Current Step:</Text>
              <View style={styles.stepsList}>
                {generationSteps.map((step, index) => {
                  const status = getCurrentStepStatus(index);
                  return (
                    <View key={index} style={styles.stepItem}>
                      <View style={[
                        status === 'completed' ? styles.stepDotCompleted :
                        status === 'current' ? styles.stepDotActive :
                        styles.stepDotPending
                      ]} />
                      <Text style={[
                        status === 'completed' ? styles.stepTextCompleted :
                        status === 'current' ? styles.stepTextActive :
                        styles.stepTextPending
                      ]}>
                        {status === 'completed' ? '✓ ' : status === 'current' ? '● ' : '○ '}
                        {step.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.timeEstimate}>
              <Text style={styles.timeText}>Creating your privacy identity...</Text>
              <Text style={styles.timeRemaining}>
                Time remaining: ~{timeRemaining} seconds
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generate Privacy Keys</Text>
      </View>

      {/* Progress Dots */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, styles.progressDotCompleted]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
      </View>

      <View style={styles.content}>
        {renderPWAAnimatedGrid()}
        <Text style={styles.subtitle}>
          zkETHer uses separate keys for privacy (different from your MetaMask keys)
        </Text>

        {/* Privacy Key Features Card */}
        <Card style={styles.featuresCard}>
          <CardContent>
            <View style={styles.cardHeader}>
              <View style={styles.lockIconContainer}>
                <View style={styles.lockIconBg} />
              </View>
              <Text style={styles.cardTitle}>Privacy Key Features:</Text>
            </View>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={styles.eyeIconContainer}>
                  <View style={styles.eyeIconBg} />
                </View>
                <Text style={styles.featureText}>Receive private notes</Text>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.shieldIconContainer}>
                  <View style={styles.shieldIconBg} />
                </View>
                <Text style={styles.featureText}>Generate ZK proofs</Text>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.greenDotContainer}>
                  <View style={styles.greenDot} />
                </View>
                <Text style={styles.featureText}>Unlinkable withdrawals</Text>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.hardDriveIconContainer}>
                  <View style={styles.hardDriveIconBg} />
                </View>
                <Text style={styles.featureText}>Stored securely on device</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Warning Card */}
        <Card style={styles.warningCard}>
          <CardContent>
            <View style={styles.warningHeader}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningTitle}>Keep these keys safe!</Text>
            </View>
            <Text style={styles.warningText}>• Lost keys = lost funds</Text>
            <Text style={styles.warningText}>• Keys are generated locally on your device</Text>
            <Text style={styles.warningText}>• Private key requires biometric authentication</Text>
          </CardContent>
        </Card>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="BACKUP LATER"
            onPress={handleBackupLater}
            variant="outline"
            style={styles.backupButton}
          />
          
          <Button
            title="GENERATE"
            onPress={handleGenerate}
            style={styles.generateButton}
          />
        </View>

        {/* Debug button for testing */}
        <TouchableOpacity onPress={handleClearKeys} style={styles.debugButton}>
          <Text style={styles.debugButtonText}>🗑️ Clear Keys (Testing)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    marginRight: 16,
  },
  backArrow: {
    fontSize: 20,
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333333',
    marginHorizontal: 2,
  },
  progressDotCompleted: {
    backgroundColor: '#00ff88',
  },
  progressDotActive: {
    backgroundColor: '#00ff88',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  dotMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
    paddingHorizontal: 40,
  },
  matrixDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    margin: 1.5,
  },
  matrixDotFilled: {
    backgroundColor: '#00ff88',
  },
  matrixDotEmpty: {
    backgroundColor: '#333333',
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  featuresCard: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00ff88',
    fontFamily: 'monospace',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  featureIconGreen: {
    fontSize: 16,
    color: '#00ff88',
    marginRight: 12,
    width: 20,
  },
  lockIconContainer: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIconBg: {
    width: 16,
    height: 16,
    backgroundColor: '#00ff88',
    borderRadius: 3,
  },
  eyeIconContainer: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIconBg: {
    width: 16,
    height: 16,
    backgroundColor: '#00ff88',
    borderRadius: 8,
  },
  shieldIconContainer: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldIconBg: {
    width: 16,
    height: 16,
    backgroundColor: '#00ff88',
    borderRadius: 3,
  },
  greenDotContainer: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greenDot: {
    width: 8,
    height: 8,
    backgroundColor: '#00ff88',
    borderRadius: 4,
  },
  hardDriveIconContainer: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hardDriveIconBg: {
    width: 16,
    height: 16,
    backgroundColor: '#00ff88',
    borderRadius: 2,
  },
  featureText: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
  },
  warningCard: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff4444',
    fontFamily: 'monospace',
  },
  warningText: {
    fontSize: 12,
    color: '#ff4444',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 'auto',
    paddingBottom: 20,
  },
  backupButton: {
    flex: 1,
    borderColor: '#666666',
  },
  generateButton: {
    flex: 1,
  },
  // Generating screen styles
  generatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  generatingContent: {
    alignItems: 'center',
    width: '100%',
  },
  dotProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    flexWrap: 'wrap',
    width: '100%',
  },
  progressDotFilled: {
    backgroundColor: '#00ff88',
  },
  progressDotEmpty: {
    backgroundColor: '#333333',
  },
  generatingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  generatingSubtitle: {
    fontSize: 14,
    color: '#888888',
  },
  // Missing styles for generating screen
  animatedDotMatrix: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  animatedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    margin: 2,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressPercentage: {
    color: '#00ff88',
  },
  // Success screen styles
  successIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 24,
  },
  keysCard: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
  },
  keySection: {
    marginBottom: 16,
  },
  keyLabel: {
    fontSize: 12,
    color: '#888888',
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  publicKeyText: {
    fontSize: 14,
    color: '#00ff88',
    fontFamily: 'monospace',
    backgroundColor: '#0a1a0a',
    padding: 8,
    borderRadius: 4,
  },
  privateKeyText: {
    fontSize: 14,
    color: '#ff8800',
    fontFamily: 'monospace',
    backgroundColor: '#1a1000',
    padding: 8,
    borderRadius: 4,
  },
  tapToReveal: {
    fontSize: 10,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  keyIdText: {
    fontSize: 14,
    color: '#88aaff',
    fontFamily: 'monospace',
    backgroundColor: '#0a0a1a',
    padding: 8,
    borderRadius: 4,
  },
  continueButton: {
    marginTop: 'auto',
  },
  progressCard: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    padding: 20,
  },
  generationSteps: {
    width: '100%',
    marginBottom: 24,
  },
  currentStepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepsList: {
    gap: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  stepDotCompleted: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff88',
    marginRight: 8,
  },
  stepDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff8800',
    marginRight: 8,
  },
  stepDotPending: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333333',
    marginRight: 8,
  },
  stepTextCompleted: {
    fontSize: 14,
    color: '#00ff88',
    fontFamily: 'monospace',
  },
  stepTextActive: {
    fontSize: 14,
    color: '#ff8800',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  stepTextPending: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'monospace',
  },
  timeEstimate: {
    alignItems: 'center',
    marginTop: 24,
  },
  timeText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  timeRemaining: {
    fontSize: 14,
    color: '#888888',
    fontFamily: 'monospace',
  },
  pwaAnimatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 80,
    marginBottom: 24,
  },
  pwaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    margin: 1,
    backgroundColor: '#00ff88',
  },
  debugButton: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    alignSelf: 'center',
  },
  debugButtonText: {
    fontSize: 12,
    color: '#888888',
    fontFamily: 'monospace',
  },
});
