import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { globalStyles } from '../../styles/globalStyles';
import { colors } from '../../styles/colors';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

export default function KeyGenerationScreen() {
  const { nextStep } = useOnboarding();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initializing...');
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    'Initializing secure environment...',
    'Generating zero-knowledge keys...',
    'Creating privacy circuits...',
    'Establishing secure channels...',
    'Finalizing setup...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 1;
        if (newProgress < steps.length) {
          setCurrentStep(steps[newProgress]);
          return newProgress;
        } else {
          setCurrentStep('Setup Complete!');
          setIsComplete(true);
          clearInterval(interval);
          return newProgress;
        }
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const handleContinue = () => {
    nextStep();
  };

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={globalStyles.header}>
        <Text style={globalStyles.headerTitle}>zkETHer</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Card style={styles.card}>
          <CardContent>
            <Text style={styles.title}>Generating Keys</Text>
            <Text style={styles.subtitle}>
              Setting up your zero-knowledge privacy infrastructure
            </Text>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(progress / steps.length) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round((progress / steps.length) * 100)}%
              </Text>
            </View>

            <Text style={styles.currentStep}>{currentStep}</Text>

            <View style={styles.keyFeatures}>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>🔐</Text>
                <Text style={styles.featureText}>Zero-Knowledge Proofs</Text>
                <Text style={styles.featureStatus}>
                  {progress >= 2 ? '✓' : '⏳'}
                </Text>
              </View>

              <View style={styles.feature}>
                <Text style={styles.featureIcon}>🛡️</Text>
                <Text style={styles.featureText}>Privacy Circuits</Text>
                <Text style={styles.featureStatus}>
                  {progress >= 3 ? '✓' : '⏳'}
                </Text>
              </View>

              <View style={styles.feature}>
                <Text style={styles.featureIcon}>🔒</Text>
                <Text style={styles.featureText}>Secure Channels</Text>
                <Text style={styles.featureStatus}>
                  {progress >= 4 ? '✓' : '⏳'}
                </Text>
              </View>
            </View>

            {isComplete && (
              <View style={styles.successMessage}>
                <Text style={styles.successTitle}>🎉 Setup Complete!</Text>
                <Text style={styles.successText}>
                  Your zkETHer wallet is ready for private transactions
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        <Button
          title={isComplete ? "Enter zkETHer" : "Generating..."}
          onPress={handleContinue}
          disabled={!isComplete}
          style={styles.continueButton}
        />

        <Text style={styles.footer}>
          Your keys are generated locally and never leave your device
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    justifyContent: 'center',
  },
  card: {
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.accent,
    textAlign: 'center',
    fontWeight: '600',
  },
  currentStep: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  keyFeatures: {
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  featureStatus: {
    fontSize: 16,
    color: colors.accent,
  },
  successMessage: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  continueButton: {
    marginBottom: 24,
  },
  footer: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
