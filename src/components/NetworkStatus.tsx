import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, fontSize } from '../styles/theme';
import { Card, CardContent } from './ui/Card';
import { contractVerification } from '../utils/contractVerification';
import { networkService } from '../services/networkService';

export default function NetworkStatus() {
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [contractStatus, setContractStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkNetworkStatus();
  }, []);

  const checkNetworkStatus = async () => {
    setIsLoading(true);
    try {
      const [deploymentInfo, verification, chainId] = await Promise.all([
        contractVerification.getDeploymentInfo(),
        contractVerification.verifyDeployment(),
        networkService.getCurrentChainId()
      ]);

      setNetworkInfo({
        ...deploymentInfo,
        currentChainId: chainId,
        networkName: networkService.getNetworkName(chainId)
      });
      setContractStatus(verification);
    } catch (error) {
      console.error('Failed to check network status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: boolean) => {
    return status ? colors.accent : colors.destructive;
  };

  const getStatusText = (status: boolean) => {
    return status ? '✅ Connected' : '❌ Not Connected';
  };

  if (isLoading) {
    return (
      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.title}>Network Status</Text>
          <Text style={styles.loading}>Loading...</Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <CardContent>
        <View style={styles.header}>
          <Text style={styles.title}>Network Status</Text>
          <TouchableOpacity onPress={checkNetworkStatus} style={styles.refreshButton}>
            <Text style={styles.refreshText}>🔄</Text>
          </TouchableOpacity>
        </View>

        {networkInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Network Info</Text>
            <Text style={styles.info}>Name: {networkInfo.networkName}</Text>
            <Text style={styles.info}>Chain ID: {networkInfo.currentChainId}</Text>
            <Text style={styles.info}>RPC: {networkInfo.rpcUrl}</Text>
            <Text style={styles.info}>Block: {networkInfo.currentBlock}</Text>
          </View>
        )}

        {contractStatus && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contract Status</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Network:</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(contractStatus.networkConnected) }]}>
                {getStatusText(contractStatus.networkConnected)}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Claim Issuer:</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(contractStatus.claimIssuer) }]}>
                {getStatusText(contractStatus.claimIssuer)}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>zkETHer Token:</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(contractStatus.zkETHerToken) }]}>
                {getStatusText(contractStatus.zkETHerToken)}
              </Text>
            </View>
          </View>
        )}

        {networkInfo?.contracts && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contract Addresses</Text>
            <Text style={styles.address}>
              Claim Issuer: {networkInfo.contracts.claimIssuer.slice(0, 10)}...
            </Text>
            <Text style={styles.address}>
              zkETHer Token: {networkInfo.contracts.zkETHerToken.slice(0, 10)}...
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.foreground,
    fontFamily: 'Courier New',
  },
  refreshButton: {
    padding: spacing.xs,
  },
  refreshText: {
    fontSize: fontSize.base,
  },
  loading: {
    fontSize: fontSize.sm,
    color: colors['muted-foreground'],
    fontFamily: 'Courier New',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.foreground,
    fontFamily: 'Courier New',
    marginBottom: spacing.xs,
  },
  info: {
    fontSize: fontSize.sm,
    color: colors['muted-foreground'],
    fontFamily: 'Courier New',
    marginBottom: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusLabel: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    fontFamily: 'Courier New',
  },
  statusValue: {
    fontSize: fontSize.sm,
    fontFamily: 'Courier New',
    fontWeight: '600',
  },
  address: {
    fontSize: fontSize.xs,
    color: colors['muted-foreground'],
    fontFamily: 'Courier New',
    marginBottom: spacing.xs,
  },
});
