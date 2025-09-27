import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { globalStyles } from '../../styles/globalStyles';
import { colors } from '../../styles/colors';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface BiometricData {
  uri: string;
  name: string;
  size: number;
}

interface BiometricVerificationScreenProps {
  onNext: (biometricData: { selfieData: BiometricData }) => void;
  onBack: () => void;
}

export default function BiometricVerificationScreen({ onNext, onBack }: BiometricVerificationScreenProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selfieCapture, setSelfieCapture] = useState<BiometricData | null>(null);
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

  // Create secure directory for biometric data
  const createBiometricDirectory = async () => {
    const biometricDir = `${FileSystem.documentDirectory}biometric_data/`;
    const dirInfo = await FileSystem.getInfoAsync(biometricDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(biometricDir, { intermediates: true });
    }
    return biometricDir;
  };

  // Save selfie to secure location
  const saveSelfieSecurely = async (sourceUri: string, fileName: string): Promise<string> => {
    const biometricDir = await createBiometricDirectory();
    const destinationUri = `${biometricDir}${fileName}`;
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });
    return destinationUri;
  };

  const handleTakeSelfie = async () => {
    try {
      setIsCameraActive(true);

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take selfie.');
        setIsCameraActive(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front, // Use front camera for selfies
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = `selfie_${Date.now()}.jpg`;
        const secureUri = await saveSelfieSecurely(asset.uri, fileName);
        
        const biometricData: BiometricData = {
          uri: secureUri,
          name: fileName,
          size: asset.fileSize || 0,
        };

        setSelfieCapture(biometricData);
      }
    } catch (error) {
      console.error('Error taking selfie:', error);
      Alert.alert('Error', 'Failed to take selfie. Please try again.');
    } finally {
      setIsCameraActive(false);
    }
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
            <Image source={{ uri: selfieCapture.uri }} style={styles.selfiePreview} />
            <Text style={styles.cameraSuccessText}>Selfie Captured</Text>
            <Text style={styles.selfieInfo}>
              {selfieCapture.name} • {(selfieCapture.size / 1024).toFixed(1)}KB
            </Text>
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
    marginTop: 8,
  },
  selfiePreview: {
    width: 180,
    height: 135,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  selfieInfo: {
    fontSize: 10,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    marginTop: 4,
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
