import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { globalStyles } from '../../styles/globalStyles';
import { colors } from '../../styles/colors';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface ContactInformationScreenProps {
  onNext: (data: { phoneNumber: string; email: string }) => void;
  onBack: () => void;
}

export default function ContactInformationScreen({ onNext, onBack }: ContactInformationScreenProps) {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    email: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers;
  };

  const isFormValid = React.useMemo(() => {
    const phoneValid = formData.phoneNumber.replace(/\D/g, '').length === 10;
    // Email is now optional - just check if it's empty or valid
    const emailValid = formData.email === '' || (formData.email.includes('@') && formData.email.includes('.'));
    return phoneValid && emailValid;
  }, [formData]);

  const handleContinue = () => {
    if (isFormValid) {
      onNext({
        phoneNumber: formData.phoneNumber.replace(/\D/g, ''),
        email: formData.email,
      });
    }
  };

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
        <Text style={styles.stepText}>Step 1 of 3</Text>
        <Text style={styles.stepTitle}>Contact Information</Text>
      </View>

      <View style={styles.content}>
        {/* Phone Number Input */}
        <Card style={styles.inputCard}>
          <CardContent>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.input}
                value={formatPhoneNumber(formData.phoneNumber)}
                onChangeText={(value) => handleInputChange('phoneNumber', value.replace(/\D/g, ''))}
                placeholder="9876543210"
                placeholderTextColor={colors.text.secondary}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            <Text style={styles.inputHint}>For OTP verification</Text>
          </CardContent>
        </Card>

        {/* Email Input */}
        <Card style={styles.inputCard}>
          <CardContent>
            <Text style={styles.inputLabel}>Email Address <Text style={styles.optionalText}>(Optional)</Text></Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="rajesh@example.com"
                placeholderTextColor={colors.text.secondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <Text style={styles.inputHint}>For notifications</Text>
          </CardContent>
        </Card>

        {/* Continue Button */}
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!isFormValid}
          style={styles.continueButton}
        />

        {/* Info Message */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoIcon}>📱</Text>
          <Text style={styles.infoText}>
            We'll extract all other info{'\n'}from your documents
          </Text>
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
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'monospace',
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
  inputCard: {
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  countryCode: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: 'monospace',
    marginRight: 8,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  inputHint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  continueButton: {
    marginTop: 20,
    marginBottom: 30,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  optionalText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: 'normal',
  },
});
