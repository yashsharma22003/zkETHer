import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useWallet } from '../contexts/WalletContext';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';
import Button from './ui/Button';
import { Card, CardContent } from './ui/Card';
import DotMatrix from './ui/DotMatrix';
import DepositFlow from './DepositFlow';
import WithdrawFlow from './WithdrawFlow';
import SettingsScreen from './SettingsScreen';
import ComplianceDashboard from './ComplianceDashboard';
import { SwapModal } from './SwapModal';
import { ShieldIcon, SettingsGearIcon } from './ui/Icons';
import { networkService } from '../services/networkService';
import { swapService } from '../services/swapService';

// Pulsing Dot Component for action buttons
function PulsingDot() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startPulsing = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startPulsing();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          width: 12,
          height: 12,
          backgroundColor: colors.text.primary,
          borderRadius: 6,
          marginBottom: 8,
        },
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    />
  );
}

export default function HomeScreen() {
  const { kycData, isKYCCompleted } = useOnboarding();
  const { isConnected, address, balance } = useWallet();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  
  // Debug KYC status
  console.log('KYC Status:', isKYCCompleted, 'KYC Data:', kycData);
  
  // Mock data matching PWA
  const mockData = {
    privacyMetrics: {
      anonymitySetSize: 47,
      unlinkabilityScore: 97.8
    },
    activity: [
      {
        id: '1',
        type: 'deposit',
        status: 'completed',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      },
      {
        id: '2', 
        type: 'withdrawal',
        status: 'completed',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        id: '3',
        type: 'deposit', 
        status: 'completed',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      }
    ]
  };
  
  const getPrivacyLevel = () => {
    const anonymitySetSize = mockData.privacyMetrics.anonymitySetSize;
    if (anonymitySetSize === 0) return "None";
    if (anonymitySetSize < 100) return "Low";
    if (anonymitySetSize < 1000) return "Medium";
    return "High";
  };
  
  const getLinkabilityPercentage = () => {
    const anonymitySetSize = mockData.privacyMetrics.anonymitySetSize;
    return anonymitySetSize > 0 ? (100 / anonymitySetSize * 100).toFixed(3) : "100";
  };
  
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `about ${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };
  
  const getActivityText = (type: string, status: string) => {
    if (type === "deposit") {
      return status === "completed" ? "Deposit completed" : "Deposit pending";
    }
    return status === "completed" ? "Withdrawal completed" : "Withdrawal pending";
  };

  return (
    <View style={globalStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header with App Title */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <DotMatrix pattern="header" size="medium" />
                <Text style={styles.appTitle}>zkETHer</Text>
                {isKYCCompleted && (
                  <View style={styles.indiaBadge}>
                    <Text style={styles.indiaBadgeText}>🇮🇳 India Ready</Text>
                  </View>
                )}
                <DotMatrix pattern="header" size="medium" />
              </View>
              <View style={styles.headerRight}>
                {/* Always show shield for testing - remove isKYCCompleted condition temporarily */}
                <TouchableOpacity style={styles.iconButton} onPress={() => setShowCompliance(true)}>
                  <View style={styles.shieldIcon}>
                    <ShieldIcon size={16} color={colors.text.primary} />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={() => setShowSettings(true)}>
                  <View style={styles.settingsIcon}>
                    <SettingsGearIcon size={16} color={colors.text.primary} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Connected Wallet Info */}
            <Card style={styles.walletCard}>
              <CardContent>
                <View style={styles.walletInfo}>
                  <Text style={styles.walletLabel}>Connected Wallet:</Text>
                  <View style={styles.walletDetails}>
                    <Text style={styles.walletEmoji}>📱</Text>
                    <Text style={styles.walletType}>
                      {isConnected ? 'WalletConnect' : 'Not Connected'} ({balance} ETH)
                    </Text>
                  </View>
                </View>
                <Text style={styles.walletAddress}>
                  {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : '0xsaec92...6d683d'}
                </Text>
              </CardContent>
            </Card>
          </View>
          {/* Balance Card */}
          <Card style={styles.balanceCard}>
            <CardContent>
              <View style={styles.balanceContent}>
                <View style={styles.dotMatrixContainer}>
                  <DotMatrix pattern="balance" size="medium" />
                </View>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceAmount}>{parseFloat(balance).toFixed(2)} ETH</Text>
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => setShowSwap(true)}
                  >
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.balanceStatus}>
                  {isKYCCompleted ? 'COMPLIANT & UNLINKABLE' : 'UNLINKABLE'}
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Privacy Status */}
          <Card style={styles.privacyCard}>
            <CardContent>
              <Text style={styles.anonymityText}>
                Anonymity Set: <Text style={styles.anonymityCount}>{mockData.privacyMetrics.anonymitySetSize} users</Text>
              </Text>
              
              {/* Privacy Indicator Dots */}
              <View style={styles.privacyDotsContainer}>
                <DotMatrix pattern="privacy" size="medium" />
              </View>
              
              <Text style={styles.unlinkableText}>
                {mockData.privacyMetrics.anonymitySetSize > 0 
                  ? "Your withdrawals are unlinkable" 
                  : "No privacy yet - be the first to deposit!"}
              </Text>
              
              <View style={styles.privacyMetrics}>
                <Text style={styles.privacyLevel}>
                  Privacy Level: <Text style={styles.privacyLevelValue}>
                    {getPrivacyLevel()}
                  </Text>
                  <Text style={styles.privacyPercentage}>
                    ({getLinkabilityPercentage()}%)
                  </Text>
                </Text>
                <Text style={styles.unlinkabilityScore}>
                  Unlinkability: <Text style={styles.unlinkabilityValue}>
                    {mockData.privacyMetrics.unlinkabilityScore.toFixed(1)}%
                  </Text>
                </Text>
              </View>
              
              {/* Compliance Status - Always show for testing */}
              <View style={styles.complianceInfo}>
                <Text style={styles.complianceStatus}>
                  Compliance Status: <Text style={styles.complianceVerified}>✓ India Verified</Text>
                </Text>
                <Text style={styles.tdsInfo}>
                  TDS Rate: 1% (Auto-deducted)
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowDeposit(true)}
            >
              <PulsingDot />
              <Text style={styles.actionTitle}>DEPOSIT</Text>
              <Text style={styles.actionSubtitle}>(Public)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowWithdraw(true)}
            >
              <PulsingDot />
              <Text style={styles.actionTitle}>WITHDRAW</Text>
              <Text style={styles.actionSubtitle}>(Anonymous)</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Activity */}
          <Card style={styles.activityCard}>
            <CardContent>
              <Text style={styles.activityTitle}>Recent Activity</Text>
              
              <View style={styles.activityList}>
                {mockData.activity.length === 0 ? (
                  <View style={styles.noActivity}>
                    <Text style={styles.noActivityText}>No recent activity</Text>
                  </View>
                ) : (
                  mockData.activity.map((item, index) => (
                    <View key={item.id} style={styles.activityItem}>
                      <View style={[
                        styles.activityDot,
                        item.status === 'completed' ? styles.activityDotCompleted : styles.activityDotPending
                      ]} />
                      <Text style={styles.activityText}>
                        {getActivityText(item.type, item.status)} {formatTimeAgo(item.timestamp)}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
      
      {/* Modals */}
      {showDeposit && (
        <DepositFlow 
          onClose={() => setShowDeposit(false)} 
        />
      )}
      
      {showWithdraw && (
        <WithdrawFlow 
          onClose={() => setShowWithdraw(false)} 
        />
      )}
      
      {showSettings && (
        <SettingsScreen 
          visible={showSettings}
          onClose={() => setShowSettings(false)} 
        />
      )}
      
      {showCompliance && (
        <ComplianceDashboard 
          visible={showCompliance}
          onClose={() => setShowCompliance(false)} 
        />
      )}
      
      {showSwap && (
        <SwapModal 
          visible={showSwap}
          onClose={() => setShowSwap(false)}
          userAddress={address || ''}
          onSwapComplete={() => {
            setShowSwap(false);
            // Optionally refresh balances here
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Status Bar Styles
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.background,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusTime: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  statusNetwork: {
    fontSize: 10,
    color: colors.text.primary,
  },
  batteryIcon: {
    width: 16,
    height: 8,
    borderWidth: 1,
    borderColor: colors.text.secondary,
    borderRadius: 2,
    padding: 1,
  },
  batteryFill: {
    width: '75%',
    height: '100%',
    backgroundColor: colors.text.primary,
    borderRadius: 1,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
  },
  signalBar: {
    width: 2,
    backgroundColor: colors.text.primary,
  },
  
  // Main Content Styles
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  
  // Header Styles
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  indiaBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  indiaBadgeText: {
    fontSize: 10,
    color: colors.accent,
    fontFamily: 'monospace',
  },
  iconButton: {
    padding: 8,
  },
  shieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
    color: colors.text.primary,
  },
  
  // Wallet Card Styles
  walletCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  walletLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  walletDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletEmoji: {
    fontSize: 12,
  },
  walletType: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  walletAddress: {
    fontSize: 10,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  
  // Balance Card Styles
  balanceCard: {
    marginBottom: 24,
    backgroundColor: colors.surface,
  },
  balanceContent: {
    alignItems: 'center',
  },
  dotMatrixContainer: {
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  balanceStatus: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  addButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Privacy Card Styles
  privacyCard: {
    marginBottom: 24,
  },
  anonymityText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  anonymityCount: {
    color: '#fbbf24', // Yellow color like PWA, not green
    fontFamily: 'monospace',
  },
  privacyDotsContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  unlinkableText: {
    fontSize: 10,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  privacyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  privacyLevel: {
    fontSize: 10,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  privacyLevelValue: {
    color: '#fbbf24', // Yellow color matching PWA
  },
  privacyPercentage: {
    color: '#fbbf24', // Yellow color matching PWA
  },
  unlinkabilityScore: {
    fontSize: 10,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  unlinkabilityValue: {
    color: '#fbbf24', // Yellow color matching PWA
  },
  complianceInfo: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 12,
  },
  complianceStatus: {
    fontSize: 10,
    color: colors.text.secondary,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  complianceVerified: {
    color: '#22c55e', // Green color matching PWA
  },
  tdsInfo: {
    fontSize: 10,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  
  // Action Buttons Styles
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  actionDot: {
    width: 12,
    height: 12,
    backgroundColor: colors.text.primary,
    borderRadius: 6,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  actionSubtitle: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  
  // Activity Card Styles
  activityCard: {
    marginBottom: 20,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  activityList: {
    gap: 12,
  },
  noActivity: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noActivityText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityDotCompleted: {
    backgroundColor: colors.accent,
  },
  activityDotPending: {
    backgroundColor: '#fbbf24',
  },
  activityText: {
    fontSize: 12,
    color: colors.text.secondary,
    flex: 1,
  },
});
