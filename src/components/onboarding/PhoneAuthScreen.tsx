import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { globalStyles } from '../../styles/globalStyles';
import { colors } from '../../styles/theme';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { firebaseAuthService } from '../../services/firebaseAuth';
// Uncomment when Firebase is properly set up
// import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
// import { firebaseConfig } from '../../config/firebase';

interface PhoneAuthScreenProps {
  onOTPSent: (phoneNumber: string) => void;
  onBack: () => void;
}

export default function PhoneAuthScreen({ onOTPSent, onBack }: PhoneAuthScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSkipOption, setShowSkipOption] = useState(true); // Always show for demo
  const recaptchaVerifier = useRef<any>(null);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers;
  };

  const isPhoneValid = React.useMemo(() => {
    return phoneNumber.replace(/\D/g, '').length === 10;
  }, [phoneNumber]);

  const handleSendOTP = async () => {
    if (!isPhoneValid) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    
    try {
      // Set reCAPTCHA verifier if available
      if (recaptchaVerifier.current) {
        firebaseAuthService.setRecaptchaVerifier(recaptchaVerifier.current);
      }

      const result = await firebaseAuthService.sendOTP(phoneNumber);
      
      if (result.success) {
        onOTPSent(phoneNumber);
      } else {
        Alert.alert('Error', result.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipForDemo = () => {
    Alert.alert(
      'Demo Mode',
      'Skip phone verification for demo purposes?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: () => onOTPSent('9876543210') // Demo phone number
        }
      ]
    );
  };

  return (
    <View style={globalStyles.container}>
      {/* Firebase reCAPTCHA - Uncomment when Firebase is set up */}
      {/* <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification={true}
      /> */}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backArrow}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phone Verification</Text>
      </View>

      <View style={styles.content}>
        {/* Info Card */}
        <Card style={styles.infoCard}>
          <CardContent>
            <View style={styles.infoContent}>
              <Text style={styles.infoIcon}>📱</Text>
              <Text style={styles.infoTitle}>Verify Your Phone Number</Text>
              <Text style={styles.infoText}>
                We'll send you a verification code to confirm your identity
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* Phone Number Input */}
        <Card style={styles.inputCard}>
          <CardContent>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.input}
                value={formatPhoneNumber(phoneNumber)}
                onChangeText={(value) => setPhoneNumber(value.replace(/\D/g, ''))}
                placeholder="9876543210"
                placeholderTextColor={colors['muted-foreground']}
                keyboardType="numeric"
                maxLength={10}
                editable={!isLoading}
              />
            </View>
            <Text style={styles.inputHint}>We'll send an OTP to this number</Text>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title={isLoading ? "Sending OTP..." : "Send OTP"}
            onPress={handleSendOTP}
            disabled={!isPhoneValid || isLoading}
            loading={isLoading}
            size="lg"
          />
          
          {showSkipOption && (
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={handleSkipForDemo}
              disabled={isLoading}
            >
              <Text style={styles.skipButtonText}>Skip for Demo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Help Text */}
        <Text style={styles.helpText}>
          Standard SMS rates may apply. We use this for account security.
        </Text>
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
    color: colors.foreground,
    fontFamily: 'Courier New',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
    fontFamily: 'Courier New',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoCard: {
    marginBottom: 30,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoContent: {
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
    fontFamily: 'Courier New',
  },
  infoText: {
    fontSize: 14,
    color: colors['muted-foreground'],
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Courier New',
  },
  inputCard: {
    marginBottom: 30,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
    marginBottom: 8,
    fontFamily: 'Courier New',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  countryCode: {
    fontSize: 16,
    color: colors.foreground,
    fontFamily: 'Courier New',
    marginRight: 8,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.foreground,
    fontFamily: 'Courier New',
  },
  inputHint: {
    fontSize: 12,
    color: colors['muted-foreground'],
    marginTop: 4,
    fontFamily: 'Courier New',
  },
  buttonContainer: {
    marginTop: 20,
  },
  skipButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Courier New',
  },
  helpText: {
    textAlign: 'center',
    color: colors['muted-foreground'],
    fontSize: 14,
    marginTop: 20,
    lineHeight: 20,
    fontFamily: 'Courier New',
  },
});
