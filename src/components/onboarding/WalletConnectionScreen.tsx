import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppKitButton } from '@reown/appkit-wagmi-react-native';
import { useWallet } from '../../contexts/WalletContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { globalStyles } from '../../styles/globalStyles';
import { colors } from '../../styles/colors';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import DotMatrix from '../DotMatrix';

type ConnectionStep = 'select' | 'connecting' | 'connected';

export default function WalletConnectionScreen() {
  const { setCurrentStep, setWalletConnection } = useOnboarding();
  const { isConnected, address, balance, walletType, connectWallet, disconnectWallet } = useWallet();
  
  const nextStep = () => {
    setCurrentStep('kyc' as any);
  };
  const [step, setStep] = useState<ConnectionStep>('select');

  const handleWalletConnectPress = async () => {
    if (isConnected) {
      await disconnectWallet();
      setStep('select');
    } else {
      setStep('connecting');
      connectWallet(); // Fixed: removed argument as connectWallet takes no parameters
    }
  };

  // Auto-advance when MetaMask connects
  React.useEffect(() => {
    if (isConnected && address) {
      setStep('connected');
      // Save wallet connection to context
      setWalletConnection(address, parseFloat(balance), walletType || 'AppKit');
      setTimeout(() => {
        nextStep();
      }, 2000);
    }
  }, [isConnected, address, balance]);

  const walletOptions = [
    {
      id: 'walletconnect',
      name: 'Connect Wallet',
      icon: '🔗', 
      description: 'MetaMask, Trust, Rainbow & more',
    }
  ];

  const renderSelectStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.headerSection}>
        <View style={styles.dotMatrixContainer}>
          <DotMatrix pattern="privacy" size="sm" />
        </View>
        <Text style={styles.description}>
          zkETHer needs access to your Ethereum wallet for deposits
        </Text>
      </View>

      <View style={styles.walletOptions}>
        {walletOptions.map((wallet) => (
          <TouchableOpacity
            key={wallet.id}
            style={styles.walletCard}
            onPress={() => handleWalletConnectPress()}
          >
            <Card style={styles.walletCardInner}>
              <CardContent>
                <View style={styles.walletHeader}>
                  <View style={styles.walletInfo}>
                    <Text style={styles.walletIcon}>{wallet.icon}</Text>
                    <View>
                      <Text style={styles.walletName}>{wallet.name}</Text>
                      <Text style={styles.walletDescription}>{wallet.description}</Text>
                    </View>
                  </View>
                  <View style={styles.walletDots}>
                    <DotMatrix pattern="header" size="sm" />
                  </View>
                </View>
                <AppKitButton />
              </CardContent>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderConnectingStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.connectingTitle}>Connecting to wallet...</Text>
      
      <View style={styles.dotMatrixContainer}>
        <DotMatrix size="md" pattern="network" />
      </View>
      
      <Text style={styles.connectingSubtitle}>Please approve in your wallet app</Text>

      <Card style={styles.mockWalletCard}>
        <CardContent>
          <View style={styles.mockWalletHeader}>
            <Text style={styles.mockWalletIcon}>🔗</Text>
            <Text style={styles.mockWalletBrand}>WalletConnect</Text>
          </View>
          
          <View style={styles.mockWalletContent}>
            <Text style={styles.mockWalletTitle}>zkETHer wants to connect</Text>
            
            <View style={styles.permissionsList}>
              <Text style={styles.permissionsTitle}>Permissions requested:</Text>
              <Text style={styles.permissionItem}>• View account address</Text>
              <Text style={styles.permissionItem}>• Request transaction approval</Text>
            </View>
          </View>
          
          <View style={styles.mockButtons}>
            <Button
              title="CANCEL"
              variant="secondary"
              style={styles.mockButton}
              onPress={() => setStep('select')}
            />
            <Button
              title="CONNECT"
              style={styles.mockButton}
              onPress={() => {
                setStep('connected');
                setTimeout(() => {
                  nextStep();
                }, 2000);
              }}
            />
          </View>
        </CardContent>
      </Card>

      <View style={styles.securityInfo}>
        <Text style={styles.securityInfoTitle}>This allows zkETHer to:</Text>
        <Text style={styles.securityInfoItem}>✓ Show your ETH balance</Text>
        <Text style={styles.securityInfoItem}>✓ Request deposit transactions</Text>
        <Text style={styles.securityInfoItem}>✗ Never access your private keys or move funds without your approval</Text>
      </View>
    </View>
  );

  const renderConnectedStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.successIcon}>
        <Text style={styles.checkmark}>✓</Text>
      </View>
      
      <Text style={styles.successTitle}>Wallet Connected</Text>
      
      <View style={styles.dotMatrixContainer}>
        <DotMatrix size="md" pattern="privacy" />
      </View>

      <Card style={styles.successCard}>
        <CardContent>
          <Text style={styles.successLabel}>SUCCESS</Text>
          <Text style={styles.successWallet}>Connected to MetaMask</Text>
          <Text style={styles.successAddress}>Address: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '0x4aec92...'}</Text>
          <Text style={styles.successBalance}>Balance: {balance} ETH</Text>
          
          <View style={styles.successDots}>
            <DotMatrix size="sm" pattern="balance" />
          </View>
        </CardContent>
      </Card>

      <Text style={styles.nextStep}>Next: Generate your zkETHer privacy keys</Text>
      
      <Button
        title="CONTINUE"
        onPress={nextStep}
        style={styles.continueButton}
      />
    </View>
  );

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>← Connect Your Wallet</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {step === 'select' && renderSelectStep()}
        {step === 'connecting' && renderConnectingStep()}
        {step === 'connected' && renderConnectedStep()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  stepContainer: {
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dotMatrixContainer: {
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  walletOptions: {
    width: '100%',
    gap: 16,
  },
  walletCard: {
    width: '100%',
  },
  walletCardInner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIcon: {
    fontSize: 24,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  walletDescription: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  walletDots: {
    alignItems: 'center',
  },
  connectButton: {
    fontFamily: 'monospace',
  },
  connectingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  connectingSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  mockWalletCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  mockWalletIcon: {
    fontSize: 24,
    textAlign: 'center',
    marginRight: 12,
  },
  mockWalletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  mockWalletBrand: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  mockWalletContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mockWalletTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  permissionsList: {
    alignItems: 'flex-start',
    gap: 4,
  },
  permissionsTitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  permissionItem: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  mockButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 8,
  },
  mockButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 100,
  },
  securityInfo: {
    alignItems: 'center',
    gap: 4,
  },
  securityInfoTitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  securityInfoItem: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  successIcon: {
    width: 64,
    height: 64,
    backgroundColor: colors.accent,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkmark: {
    fontSize: 32,
    color: colors.background,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.accent,
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  successCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  successLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 8,
  },
  successWallet: {
    fontSize: 14,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  successAddress: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 4,
  },
  successBalance: {
    fontSize: 14,
    color: colors.text.primary,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 16,
  },
  successDots: {
    alignItems: 'center',
  },
  nextStep: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  continueButton: {
    paddingVertical: 16,
  },
});
