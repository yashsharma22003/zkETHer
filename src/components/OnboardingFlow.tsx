import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { colors, spacing, fontSize } from '../styles/theme';
import Button from './ui/Button';
import DotMatrix from './ui/DotMatrix';

const OnboardingFlow: React.FC = () => {
  return (
    <View style={[globalStyles.container, styles.container]}>
      {/* Status Bar */}
      <View style={globalStyles.statusBar}>
        <Text style={globalStyles.statusBarText}>zkETHer Mobile</Text>
        <Text style={globalStyles.statusBarText}>v1.0.0</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <DotMatrix pattern="header" />
        
        <View style={styles.titleSection}>
          <Text style={styles.title}>zkETHer</Text>
          <Text style={styles.subtitle}>Privacy-preserving DeFi with KYC compliance</Text>
        </View>

        <View style={styles.buttonSection}>
          <Button
            title="Get Started"
            onPress={() => console.log('Get Started pressed')}
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
  container: {
    padding: spacing.md,
  },
  
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  
  buttonSection: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
  },
  
  secondaryButton: {
    marginTop: spacing.sm,
  },
});

export default OnboardingFlow;
