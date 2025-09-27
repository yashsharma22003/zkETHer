import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { globalStyles } from '../../styles/globalStyles';
import { colors } from '../../styles/colors';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface BiometricVerificationScreenProps {
  onNext: (biometricData: { selfieData: string }) => void;
  onBack: () => void;
}

export default function BiometricVerificationScreen({ onNext, onBack }: BiometricVerificationScreenProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selfieCapture, setSelfieCapture] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start pulsing animation for camera frame
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleTakeSelfie = () => {
    // Mock selfie capture - in real app this would open camera
    setIsCameraActive(true);
    
    // Simulate camera capture after 2 seconds
    setTimeout(() => {
      setSelfieCapture(`selfie_${Date.now()}`);
      setIsCameraActive(false);
    }, 2000);
  };

  const handleContinue = () => {
    if (selfieCapture) {
      onNext({ selfieData: selfieCapture });
    }
  };

  const renderCameraView = () => (
    <Animated.View style={[styles.cameraContainer, { transform: [{ scale: pulseAnim }] }]}>
      <View style={styles.cameraFrame}>
        {isCameraActive ? (
          <View style={styles.cameraActive}>
            <Text style={styles.cameraActiveText}>📷</Text>
            <Text style={styles.capturingText}>Capturing...</Text>
          </View>
        ) : selfieCapture ? (
          <View style={styles.cameraSuccess}>
            <Text style={styles.cameraSuccessIcon}>✓</Text>
            <Text style={styles.cameraSuccessText}>Selfie Captured</Text>
          </View>
        ) : (
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.cameraText}>Camera View</Text>
          </View>
        )}
      </View>
      
      {!selfieCapture && !isCameraActive && (
        <View style={styles.faceGuide}>
          <View style={styles.faceOutline} />
        </View>
      )}
    </Animated.View>
  );

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backArrow}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepContainer}>
        <Text style={styles.stepText}>Step 3 of 3</Text>
        <Text style={styles.stepTitle}>Biometric Verification</Text>
      </View>

      <View style={styles.content}>
        {/* Camera Section */}
        <Card style={styles.cameraCard}>
          <CardContent>
            {renderCameraView()}
            
            <Text style={styles.instructionText}>
              Position your face in the{'\n'}camera frame
            </Text>
          </CardContent>
        </Card>

        {/* Take Selfie Button */}
        <Button
          title={selfieCapture ? "Retake Selfie" : "Take Selfie"}
          onPress={handleTakeSelfie}
          disabled={isCameraActive}
          style={[
            styles.selfieButton,
            selfieCapture && styles.selfieButtonSuccess
          ]}
        />

        {/* Continue Button */}
        {selfieCapture && (
          <Button
            title="Continue"
            onPress={handleContinue}
            style={styles.continueButton}
          />
        )}

        {/* Info Messages */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📸</Text>
            <Text style={styles.infoText}>Face matching with Aadhaar photo</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🔐</Text>
            <Text style={styles.infoText}>Processed locally on device</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  backArrow: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  stepContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  stepText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cameraCard: {
    marginBottom: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cameraContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cameraFrame: {
    width: 200,
    height: 150,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cameraPlaceholder: {
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cameraText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  cameraActive: {
    alignItems: 'center',
  },
  cameraActiveText: {
    fontSize: 32,
    marginBottom: 8,
  },
  capturingText: {
    fontSize: 14,
    color: '#fbbf24',
    fontFamily: 'monospace',
  },
  cameraSuccess: {
    alignItems: 'center',
  },
  cameraSuccessIcon: {
    fontSize: 32,
    color: colors.accent,
    marginBottom: 8,
  },
  cameraSuccessText: {
    fontSize: 14,
    color: colors.accent,
    fontFamily: 'monospace',
  },
  faceGuide: {
    position: 'absolute',
    top: 20,
    left: 50,
    right: 50,
    bottom: 20,
  },
  faceOutline: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 100,
    opacity: 0.3,
  },
  instructionText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  selfieButton: {
    marginBottom: 20,
  },
  selfieButtonSuccess: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  continueButton: {
    marginBottom: 30,
  },
  infoContainer: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
});
