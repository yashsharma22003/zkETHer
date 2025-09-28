import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { globalStyles } from '../../styles/globalStyles';
import { colors } from '../../styles/colors';
import { Card, CardContent } from '../ui/Card';
import { sandboxApiService } from '../../services/sandboxApi';
import { zkETHerProtocol } from '../../services/zkETHerProtocol';

interface DocumentProcessingScreenProps {
  onComplete: (extractedData: any) => void;
}

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed';
}

export default function DocumentProcessingScreen({ onComplete }: DocumentProcessingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [extractedData] = useState({
    name: 'Rajesh Kumar Singh',
    dob: '15/01/1990',
    aadhaar: '1234 5678 9012',
    pan: 'ABCDE1234F',
    address: '123 MG Road, Bangalore, Karnataka 560001',
  });

  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: '1', label: 'Aadhaar verification with Sandbox API', status: 'pending' },
    { id: '2', label: 'PAN verification with Sandbox API', status: 'pending' },
    { id: '3', label: 'Face match verification', status: 'pending' },
    { id: '4', label: 'Creating OnchainID with claims', status: 'pending' },
  ]);

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start loading animation
    Animated.loop(
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Start real KYC processing with mock services
    const processKYC = async () => {
      try {
        console.log('🔄 Starting KYC processing with zkETHer Protocol integration...');
        
        // Step 1: Aadhaar verification
        setSteps(prevSteps => 
          prevSteps.map((step, index) => 
            index === 0 ? { ...step, status: 'processing' } : step
          )
        );
        
        const aadhaarResult = await sandboxApiService.verifyAadhaar(
          extractedData.aadhaar.replace(/\s/g, ''), 
          extractedData.name
        );
        
        setSteps(prevSteps => 
          prevSteps.map((step, index) => 
            index === 0 ? { ...step, status: 'completed' } : step
          )
        );
        setProgress(25);

        // Step 2: PAN verification
        setSteps(prevSteps => 
          prevSteps.map((step, index) => 
            index === 1 ? { ...step, status: 'processing' } : step
          )
        );
        
        const panResult = await sandboxApiService.verifyPAN(
          extractedData.pan,
          extractedData.name
        );
        
        setSteps(prevSteps => 
          prevSteps.map((step, index) => 
            index === 1 ? { ...step, status: 'completed' } : step
          )
        );
        setProgress(50);

        // Step 3: Face match verification
        setSteps(prevSteps => 
          prevSteps.map((step, index) => 
            index === 2 ? { ...step, status: 'processing' } : step
          )
        );
        
        const faceMatchResult = await sandboxApiService.verifyFaceMatch(
          'mock_aadhaar_photo_base64',
          'mock_selfie_base64'
        );
        
        setSteps(prevSteps => 
          prevSteps.map((step, index) => 
            index === 2 ? { ...step, status: 'completed' } : step
          )
        );
        setProgress(75);

        // Step 4: Create OnchainID with claims
        setSteps(prevSteps => 
          prevSteps.map((step, index) => 
            index === 3 ? { ...step, status: 'processing' } : step
          )
        );

        const zkETHerEligibility = await sandboxApiService.checkzkETHerEligibility('0x1234567890123456789012345678901234567890');
        
        // Create OnchainID and issue all claims using zkETHer Protocol
        const onchainResult = await zkETHerProtocol.processKYCVerification({
          userAddress: '0x1234567890123456789012345678901234567890', // Mock user address
          aadhaarData: aadhaarResult,
          panData: panResult,
          faceMatchData: faceMatchResult
        });

        setSteps(prevSteps => 
          prevSteps.map((step, index) => 
            index === 3 ? { ...step, status: 'completed' } : step
          )
        );
        setProgress(100);

        console.log('✅ KYC processing completed successfully!', {
          onchainId: onchainResult.onchainID,
          isVerified: onchainResult.isVerified
        });

        // Complete with enhanced data including OnchainID
        const enhancedData = {
          ...extractedData,
          onchainId: onchainResult.onchainID,
          verificationResults: {
            aadhaar: aadhaarResult,
            pan: panResult,
            faceMatch: faceMatchResult,
            zkETHerEligibility: zkETHerEligibility
          },
          claims: onchainResult.claims,
          isFullyVerified: onchainResult.isVerified
        };

        setTimeout(() => {
          onComplete(enhancedData);
        }, 1500);

      } catch (error) {
        console.error('❌ KYC processing failed:', error);
        // Fallback to mock data on error
        setTimeout(() => {
          onComplete(extractedData);
        }, 1500);
      }
    };

    processKYC();

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [onComplete, extractedData]);

  const getStatusIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'processing':
        return '⏳';
      default:
        return '⏳';
    }
  };

  const getStatusColor = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return colors.accent;
      case 'processing':
        return '#fbbf24';
      default:
        return colors.text.secondary;
    }
  };

  const rotateInterpolate = loadingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>KYC Verification</Text>
      </View>

      {/* Processing Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Processing Documents</Text>
      </View>

      <View style={styles.content}>
        {/* Loading Animation */}
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingIcon,
              { transform: [{ rotate: rotateInterpolate }] }
            ]}
          >
            <Text style={styles.loadingText}>⚙️</Text>
          </Animated.View>
          <Text style={styles.loadingLabel}>Extracting information...</Text>
        </View>

        {/* Processing Steps */}
        <Card style={styles.stepsCard}>
          <CardContent>
            {steps.map((step, index) => (
              <View key={step.id} style={styles.stepItem}>
                <Text style={[styles.stepIcon, { color: getStatusColor(step.status) }]}>
                  {getStatusIcon(step.status)}
                </Text>
                <Text style={[
                  styles.stepText,
                  step.status === 'completed' && styles.stepTextCompleted
                ]}>
                  {step.label}
                </Text>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* Extracted Information */}
        <Card style={styles.extractedCard}>
          <CardContent>
            <Text style={styles.extractedTitle}>Extracted Information</Text>
            
            <View style={styles.extractedInfo}>
              <Text style={styles.extractedItem}>Name: {extractedData.name}</Text>
              <Text style={styles.extractedItem}>DOB: {extractedData.dob}</Text>
              <Text style={styles.extractedItem}>Aadhaar: {extractedData.aadhaar}</Text>
              <Text style={styles.extractedItem}>PAN: {extractedData.pan}</Text>
              <Text style={styles.extractedItem}>Address: {extractedData.address}</Text>
            </View>
          </CardContent>
        </Card>

        {/* Verification Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusIcon}>🔄</Text>
          <Text style={styles.statusText}>Verifying with government APIs...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  titleContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  loadingIcon: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 32,
  },
  loadingLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  stepsCard: {
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stepIcon: {
    fontSize: 14,
    marginRight: 12,
    width: 16,
  },
  stepText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    flex: 1,
  },
  stepTextCompleted: {
    color: colors.accent,
  },
  extractedCard: {
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  extractedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  extractedInfo: {
    gap: 8,
  },
  extractedItem: {
    fontSize: 14,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
});
