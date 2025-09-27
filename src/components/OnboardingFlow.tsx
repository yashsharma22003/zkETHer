import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { colors, spacing, fontSize } from '../styles/theme';
import Button from './ui/Button';
import DotMatrix from './ui/DotMatrix';
import { useWallet } from '../contexts/WalletContext';

const OnboardingFlow: React.FC = () => {
  const { isConnected, address, balance, connectWallet, disconnectWallet } = useWallet();

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

        {/* Wallet Status */}
        {isConnected ? (
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>Connected Wallet</Text>
            <Text style={styles.walletAddress}>
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </Text>
            <Text style={styles.walletBalance}>{balance} ETH</Text>
          </View>
        ) : null}

        <View style={styles.buttonSection}>
          {!isConnected ? (
            <>
              <Button
                title="Connect Wallet"
                onPress={connectWallet}
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
            </>
          ) : (
            <>
              <Button
                title="Start KYC Process"
                onPress={() => console.log('Start KYC pressed')}
                variant="default"
                size="lg"
              />
              
              <Button
                title="Disconnect Wallet"
                onPress={disconnectWallet}
                variant="outline"
                size="default"
                style={styles.secondaryButton}
              />
            </>
          )}
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
  
  walletInfo: {
    alignItems: 'center',
    marginVertical: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  walletLabel: {
    fontSize: fontSize.sm,
    color: colors['muted-foreground'],
    fontFamily: 'Courier New',
    marginBottom: spacing.xs,
  },
  
  walletAddress: {
    fontSize: fontSize.base,
    color: colors.accent,
    fontFamily: 'Courier New',
    marginBottom: spacing.xs,
  },
  
  walletBalance: {
    fontSize: fontSize.lg,
    color: colors.foreground,
    fontFamily: 'Courier New',
    fontWeight: '600',
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
