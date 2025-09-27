import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { globalStyles } from '../../styles/globalStyles';
import { colors, spacing, fontSize } from '../../styles/theme';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import DotMatrix from '../ui/DotMatrix';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  return (
    <View style={globalStyles.container}>
      {/* Status Bar */}
      <View style={globalStyles.statusBar}>
        <Text style={globalStyles.statusBarText}>zkETHer Mobile</Text>
        <Text style={globalStyles.statusBarText}>v1.0.0</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <DotMatrix pattern="header" size="medium" />
        
        <View style={styles.titleSection}>
          <Text style={styles.title}>zkETHer</Text>
          <Text style={styles.subtitle}>Privacy-preserving DeFi with KYC compliance</Text>
        </View>

        {/* Feature Cards */}
        <Card style={styles.featureCard}>
          <CardContent>
            <View style={styles.features}>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>🔒</Text>
                <Text style={styles.featureText}>Private Transactions</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>🇮🇳</Text>
                <Text style={styles.featureText}>India Compliant</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>⚡</Text>
                <Text style={styles.featureText}>Zero-Knowledge Proofs</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        <View style={styles.buttonSection}>
          <Button
            title="Get Started"
            onPress={onGetStarted}
            variant="default"
            size="lg"
          />
          
          <Button
            title="Learn More"
            onPress={() => console.log('Learn More pressed')}
            variant="outline"
            size="default"
            style={styles.secondaryButton}
          />
        </View>
      </View>

      {/* India Ready Badge */}
      <View style={globalStyles.indiaReadyBadge}>
        <Text style={globalStyles.indiaReadyText}>INDIA READY</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  
  titleSection: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: '700',
    color: colors.foreground,
    fontFamily: 'Courier New',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  
  subtitle: {
    fontSize: fontSize.base,
    color: colors['muted-foreground'],
    textAlign: 'center',
    fontFamily: 'Courier New',
  },
  
  featureCard: {
    marginVertical: spacing.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  
  features: {
    gap: spacing.md,
  },
  
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  
  featureIcon: {
    fontSize: 20,
  },
  
  featureText: {
    fontSize: fontSize.base,
    color: colors.foreground,
    fontFamily: 'Courier New',
  },
  
  buttonSection: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  
  secondaryButton: {
    marginTop: spacing.sm,
  },
});

export default WelcomeScreen;
