import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { globalStyles } from '../../styles/globalStyles';
import { colors } from '../../styles/colors';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface VerificationSuccessScreenProps {
  onGenerateKeys: () => void;
  onchainId?: string;
}

export default function VerificationSuccessScreen({ onGenerateKeys, onchainId }: VerificationSuccessScreenProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Success animation sequence
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  const claims = [
    { id: '1', label: 'Aadhaar Verified', icon: '✓' },
    { id: '2', label: 'PAN Verified', icon: '✓' },
    { id: '3', label: 'AML Cleared', icon: '✓' },
    { id: '4', label: 'KYC Level 2', icon: '✓' },
  ];

  const displayOnchainId = onchainId || '0xabc123...def456';

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>KYC Verification</Text>
      </View>

      {/* Success Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.title}>Verification Complete</Text>
      </View>

      <View style={styles.content}>
        {/* Success Card */}
        <Card style={styles.successCard}>
          <CardContent>
            <Animated.View
              style={[
                styles.successContent,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              <View style={styles.successIconContainer}>
                <Text style={styles.successIconLarge}>🎉</Text>
              </View>
              
              <Text style={styles.successTitle}>
                Identity Successfully{'\n'}Verified
              </Text>
              
              <View style={styles.claimsContainer}>
                <Text style={styles.claimsTitle}>Your Claims:</Text>
                {claims.map((claim) => (
                  <View key={claim.id} style={styles.claimItem}>
                    <Text style={styles.claimIcon}>{claim.icon}</Text>
                    <Text style={styles.claimText}>{claim.label}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </CardContent>
        </Card>

        {/* ONCHAINID Display */}
        <Animated.View style={[styles.onchainContainer, { opacity: fadeAnim }]}>
          <Text style={styles.onchainLabel}>ONCHAINID:</Text>
          <Text style={styles.onchainId}>{displayOnchainId}</Text>
        </Animated.View>

        {/* Generate Keys Button */}
        <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
          <Button
            title="Generate Privacy Keys"
            onPress={onGenerateKeys}
            style={styles.generateButton}
          />
        </Animated.View>

        {/* Ready Message */}
        <Animated.View style={[styles.readyContainer, { opacity: fadeAnim }]}>
          <Text style={styles.readyIcon}>🎉</Text>
          <Text style={styles.readyText}>Ready for compliant privacy!</Text>
        </Animated.View>
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
  successIcon: {
    fontSize: 24,
    marginBottom: 8,
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
  successCard: {
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  successContent: {
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successIconLarge: {
    fontSize: 48,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'monospace',
    lineHeight: 24,
  },
  claimsContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  claimsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  claimItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  claimIcon: {
    fontSize: 14,
    color: colors.accent,
    marginRight: 12,
    width: 16,
  },
  claimText: {
    fontSize: 14,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  onchainContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  onchainLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  onchainId: {
    fontSize: 14,
    color: colors.accent,
    fontFamily: 'monospace',
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonContainer: {
    marginBottom: 30,
  },
  generateButton: {
    backgroundColor: colors.accent,
    borderWidth: 0,
  },
  readyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  readyText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
});
