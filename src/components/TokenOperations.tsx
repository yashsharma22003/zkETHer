/**
 * Token Operations Component
 * Handles SepoliaETH to zkETH swaps and token management
 * Integrates with zkETHer Protocol smart contracts
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../styles/colors';
import { Card, CardContent } from './ui/Card';
import { zkETHerTokenService } from '../services/zkETHerTokenService';
import { onchainIdService } from '../services/onchainIdService';

interface TokenOperationsProps {
  userAddress?: string;
  onchainId?: string;
  isVerified?: boolean;
}

export default function TokenOperations({ 
  userAddress = '0x1234567890123456789012345678901234567890',
  onchainId,
  isVerified = false 
}: TokenOperationsProps) {
  const [balances, setBalances] = useState({
    eth: '0.0',
    zkETH: '0.0'
  });
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTDSRate, setCurrentTDSRate] = useState(1);

  useEffect(() => {
    loadBalances();
    loadTDSRate();
  }, [userAddress]);

  const loadBalances = async () => {
    try {
      const tokenBalances = await zkETHerTokenService.getBalances(userAddress);
      setBalances({
        eth: tokenBalances.formatted.ETH,
        zkETH: tokenBalances.formatted.zkETH
      });
    } catch (error) {
      console.error('Failed to load balances:', error);
    }
  };

  const loadTDSRate = () => {
    const rate = zkETHerTokenService.getCurrentTDSRate();
    setCurrentTDSRate(rate / 100); // Convert basis points to percentage
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid deposit amount');
      return;
    }

    if (!isVerified || !onchainId) {
      Alert.alert('Verification Required', 'Please complete KYC verification to deposit tokens');
      return;
    }

    setIsLoading(true);
    try {
      const tdsCalc = zkETHerTokenService.calculateTDS(depositAmount);
      
      Alert.alert(
        'Confirm Deposit',
        `Deposit: ${depositAmount} ETH\nTDS (${currentTDSRate}%): ${tdsCalc.formatted.tds} ETH\nYou'll receive: ${tdsCalc.formatted.net} zkETH`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Confirm', 
            onPress: async () => {
              const result = await zkETHerTokenService.deposit(
                userAddress,
                depositAmount,
                onchainId
              );

              if (result.success) {
                Alert.alert(
                  'Deposit Successful!',
                  `Transaction Hash: ${result.transactionHash.slice(0, 10)}...\nReceived: ${result.netAmount} zkETH`
                );
                setDepositAmount('');
                loadBalances();
              } else {
                Alert.alert('Deposit Failed', result.error || 'Unknown error occurred');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process deposit');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid withdrawal amount');
      return;
    }

    if (!isVerified || !onchainId) {
      Alert.alert('Verification Required', 'Please complete KYC verification to withdraw tokens');
      return;
    }

    setIsLoading(true);
    try {
      const tdsCalc = zkETHerTokenService.calculateTDS(withdrawAmount);
      const zkProof = zkETHerTokenService.generateZKProof(userAddress, withdrawAmount, 'withdraw');
      
      Alert.alert(
        'Confirm Withdrawal',
        `Withdraw: ${withdrawAmount} zkETH\nTDS (${currentTDSRate}%): ${tdsCalc.formatted.tds} ETH\nYou'll receive: ${tdsCalc.formatted.net} ETH`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Confirm', 
            onPress: async () => {
              const result = await zkETHerTokenService.withdraw(
                userAddress,
                withdrawAmount,
                zkProof
              );

              if (result.success) {
                Alert.alert(
                  'Withdrawal Successful!',
                  `Transaction Hash: ${result.transactionHash.slice(0, 10)}...\nReceived: ${result.netAmount} ETH`
                );
                setWithdrawAmount('');
                loadBalances();
              } else {
                Alert.alert('Withdrawal Failed', result.error || 'Unknown error occurred');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>zkETHer Token Operations</Text>
      
      {/* Verification Status */}
      <Card style={styles.statusCard}>
        <CardContent>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Verification Status:</Text>
            <Text style={[
              styles.statusValue,
              { color: isVerified ? colors.accent : colors.error }
            ]}>
              {isVerified ? '✅ Verified' : '❌ Not Verified'}
            </Text>
          </View>
          {onchainId && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>OnchainID:</Text>
              <Text style={styles.addressText}>{onchainId.slice(0, 10)}...{onchainId.slice(-8)}</Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Balances */}
      <Card style={styles.balanceCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Your Balances</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Sepolia ETH:</Text>
            <Text style={styles.balanceValue}>{balances.eth} ETH</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>zkETH:</Text>
            <Text style={styles.balanceValue}>{balances.zkETH} zkETH</Text>
          </View>
          <View style={styles.tdsInfo}>
            <Text style={styles.tdsText}>TDS Rate: {currentTDSRate}%</Text>
          </View>
        </CardContent>
      </Card>

      {/* Deposit Section */}
      <Card style={styles.operationCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Deposit ETH → zkETH</Text>
          <Text style={styles.description}>
            Convert your Sepolia ETH to privacy-preserving zkETH tokens
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Amount in ETH"
              value={depositAmount}
              onChangeText={setDepositAmount}
              keyboardType="numeric"
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.button,
                (!isVerified || isLoading) && styles.buttonDisabled
              ]}
              onPress={handleDeposit}
              disabled={!isVerified || isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Processing...' : 'Deposit'}
              </Text>
            </TouchableOpacity>
          </View>
        </CardContent>
      </Card>

      {/* Withdraw Section */}
      <Card style={styles.operationCard}>
        <CardContent>
          <Text style={styles.sectionTitle}>Withdraw zkETH → ETH</Text>
          <Text style={styles.description}>
            Convert your zkETH tokens back to Sepolia ETH with zero-knowledge privacy
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Amount in zkETH"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.button,
                (!isVerified || isLoading) && styles.buttonDisabled
              ]}
              onPress={handleWithdraw}
              disabled={!isVerified || isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Processing...' : 'Withdraw'}
              </Text>
            </TouchableOpacity>
          </View>
        </CardContent>
      </Card>

      {!isVerified && (
        <Card style={styles.warningCard}>
          <CardContent>
            <Text style={styles.warningText}>
              ⚠️ Complete KYC verification to start using zkETHer tokens
            </Text>
          </CardContent>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  statusCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  addressText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  balanceCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.accent,
    fontFamily: 'monospace',
  },
  tdsInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tdsText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  operationCard: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  description: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  inputContainer: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.text.secondary,
    opacity: 0.5,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  warningCard: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});
