import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { globalStyles } from '../../styles/globalStyles';
import { colors } from '../../styles/colors';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import DotMatrix from '../DotMatrix';

export default function WelcomeScreen() {
  const { nextStep } = useOnboarding();

  return (
    <View style={globalStyles.container}>
      {/* Main Content - Centered */}
      <View style={styles.content}>
        {/* Header with App Title and Dots */}
        <View style={styles.headerSection}>
          <View style={styles.titleContainer}>
            <DotMatrix pattern="header" size="sm" />
            <Text style={styles.appTitle}>zkETHer</Text>
            <DotMatrix pattern="header" size="sm" />
          </View>
          <Text style={styles.subtitle}>Private ETH Transfers</Text>
        </View>

        {/* Feature Showcase Card */}
        <Card style={styles.featureCard}>
          <CardContent>
            <View style={styles.dotMatrixContainer}>
              <DotMatrix pattern="balance" />
            </View>
            
            <View style={styles.features}>
              <View style={styles.feature}>
                <View style={styles.pulseDot} />
                <Text style={styles.featureText}>Send ETH Unlinkably</Text>
              </View>
              <View style={styles.feature}>
                <View style={styles.pulseDot} />
                <Text style={styles.featureText}>Break Transaction Links</Text>
              </View>
              <View style={styles.feature}>
                <View style={styles.pulseDot} />
                <Text style={styles.featureText}>Protect Your Privacy</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <Button
            title="GET STARTED"
            onPress={nextStep}
            style={styles.getStartedButton}
          />
          
          <View style={styles.secondaryButtons}>
            <Button
              title="Learn More"
              variant="secondary"
              onPress={() => console.log('Learn More pressed')}
              style={styles.secondaryButton}
            />
            <Button
              title="Skip"
              variant="outline"
              onPress={() => console.log('Skip pressed')}
              style={styles.secondaryButton}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  featureCard: {
    marginBottom: 32,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dotMatrixContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  features: {
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pulseDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  featureText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  buttonSection: {
    width: '100%',
    gap: 16,
  },
  getStartedButton: {
    paddingVertical: 24,
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
  },
});
