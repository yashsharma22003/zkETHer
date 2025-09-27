import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
  StatusBar,
} from 'react-native';
import { useOnboarding } from '../contexts/OnboardingContext';
import { colors } from '../styles/colors';
import { Card, CardContent } from './ui/Card';
import DotMatrix from './ui/DotMatrix';
import { ArrowLeftIcon, SettingsGearIcon, UserIcon, FileTextIcon, ShieldIcon, LockIcon, DownloadIcon, HelpCircleIcon } from './ui/Icons';

interface SettingsScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsScreen({ visible, onClose }: SettingsScreenProps) {
  const { isKYCCompleted, kycData } = useOnboarding();
  const [autoDeductTDS, setAutoDeductTDS] = useState(true);
  const [shareDataWithAuthorities, setShareDataWithAuthorities] = useState(true);

  const handleUpdateKYC = () => {
    // Mock action
    console.log('Update KYC clicked');
  };

  const handleDownloadReport = (reportType: string) => {
    console.log(`Download ${reportType} clicked`);
  };

  const handleRegulatoryHelp = () => {
    console.log('Regulatory Helpdesk clicked');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <ArrowLeftIcon size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerIcon}>
            <SettingsGearIcon size={20} color={colors.text.primary} />
          </View>
        </View>

        {/* Dot Matrix */}
        <View style={styles.dotMatrixContainer}>
          <DotMatrix pattern="header" size="small" />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            {/* KYC Status Section */}
            <Card style={styles.sectionCard}>
              <CardContent style={styles.cardContent}>
                <View style={styles.sectionHeader}>
                  <UserIcon size={16} color={colors.text.primary} />
                  <Text style={styles.sectionTitle}>KYC Status</Text>
                </View>
                
                <View style={styles.kycDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Verification Status:</Text>
                    <View style={styles.verificationStatus}>
                      <Text style={styles.verifiedText}>Verified</Text>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  </View>
                  
                  {isKYCCompleted && kycData && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Name:</Text>
                        <Text style={styles.detailValue}>{kycData.fullName || 'Shreyansh Singh'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Valid Until:</Text>
                        <Text style={styles.detailValue}>Dec 2024</Text>
                      </View>
                    </>
                  )}
                </View>
                
                <TouchableOpacity style={styles.updateButton} onPress={handleUpdateKYC}>
                  <Text style={styles.updateButtonText}>Update KYC</Text>
                </TouchableOpacity>
              </CardContent>
            </Card>

            {/* Tax Preferences Section */}
            <Card style={styles.sectionCard}>
              <CardContent style={styles.cardContent}>
                <View style={styles.sectionHeader}>
                  <FileTextIcon size={16} color={colors.text.primary} />
                  <Text style={styles.sectionTitle}>Tax Preferences</Text>
                </View>
                
                <View style={styles.switchContainer}>
                  <View style={styles.switchContent}>
                    <Text style={styles.switchLabel}>Auto-deduct TDS</Text>
                    <Text style={styles.switchDescription}>Automatically deduct 1% TDS on transactions</Text>
                  </View>
                  <Switch
                    value={autoDeductTDS}
                    onValueChange={setAutoDeductTDS}
                    disabled={true}
                    trackColor={{ false: colors.border, true: colors.accent }}
                    thumbColor={colors.text.primary}
                  />
                </View>
                
                <View style={styles.mandatoryNotice}>
                  <LockIcon size={12} color={colors.text.secondary} />
                  <Text style={styles.mandatoryText}>TDS auto-deduction is mandatory for compliance</Text>
                </View>
              </CardContent>
            </Card>

            {/* Reporting Section */}
            <Card style={styles.sectionCard}>
              <CardContent style={styles.cardContent}>
                <View style={styles.sectionHeader}>
                  <ShieldIcon size={16} color={colors.text.primary} />
                  <Text style={styles.sectionTitle}>Reporting</Text>
                </View>
                
                <View style={styles.switchContainer}>
                  <View style={styles.switchContent}>
                    <Text style={styles.switchLabel}>Share data with tax authorities</Text>
                    <Text style={styles.switchDescription}>Required for regulatory compliance</Text>
                  </View>
                  <Switch
                    value={shareDataWithAuthorities}
                    onValueChange={setShareDataWithAuthorities}
                    disabled={true}
                    trackColor={{ false: colors.border, true: colors.accent }}
                    thumbColor={colors.text.primary}
                  />
                </View>
                
                <View style={styles.mandatoryNotice}>
                  <LockIcon size={12} color={colors.text.secondary} />
                  <Text style={styles.mandatoryText}>Data sharing with FIU-India is mandatory</Text>
                </View>
              </CardContent>
            </Card>

            {/* Privacy Level Section */}
            <Card style={styles.sectionCard}>
              <CardContent style={styles.cardContent}>
                <View style={styles.sectionHeader}>
                  <LockIcon size={16} color={colors.text.primary} />
                  <Text style={styles.sectionTitle}>Privacy Level</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Current Mode:</Text>
                  <Text style={styles.privacyMode}>Compliant Privacy Mode</Text>
                </View>
                
                <View style={styles.mandatoryNotice}>
                  <LockIcon size={12} color={colors.text.secondary} />
                  <Text style={styles.mandatoryText}>Privacy mode locked for regulatory compliance</Text>
                </View>
                
                <View style={styles.privacyFeatures}>
                  <Text style={styles.featureText}>• Zero-knowledge proofs maintain transaction privacy</Text>
                  <Text style={styles.featureText}>• Regulatory reporting ensures compliance</Text>
                  <Text style={styles.featureText}>• Identity verification prevents misuse</Text>
                </View>
              </CardContent>
            </Card>

            {/* Export Options Section */}
            <Card style={styles.sectionCard}>
              <CardContent style={styles.cardContent}>
                <View style={styles.sectionHeader}>
                  <DownloadIcon size={16} color={colors.text.primary} />
                  <Text style={styles.sectionTitle}>Export Options</Text>
                </View>
                
                <View style={styles.exportButtons}>
                  <TouchableOpacity 
                    style={styles.exportButton} 
                    onPress={() => handleDownloadReport('Tax Certificate')}
                  >
                    <DownloadIcon size={14} color={colors.text.primary} />
                    <Text style={styles.exportButtonText}>Download Tax Certificate</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.exportButton} 
                    onPress={() => handleDownloadReport('Compliance Report')}
                  >
                    <DownloadIcon size={14} color={colors.text.primary} />
                    <Text style={styles.exportButtonText}>Download Compliance Report</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.exportButton} 
                    onPress={() => handleDownloadReport('Transaction History')}
                  >
                    <DownloadIcon size={14} color={colors.text.primary} />
                    <Text style={styles.exportButtonText}>Download Transaction History</Text>
                  </TouchableOpacity>
                </View>
              </CardContent>
            </Card>

            {/* Support Section */}
            <Card style={styles.sectionCard}>
              <CardContent style={styles.cardContent}>
                <View style={styles.sectionHeader}>
                  <HelpCircleIcon size={16} color={colors.text.primary} />
                  <Text style={styles.sectionTitle}>Support</Text>
                </View>
                
                <TouchableOpacity style={styles.supportButton} onPress={handleRegulatoryHelp}>
                  <HelpCircleIcon size={16} color={colors.text.primary} />
                  <Text style={styles.supportButtonText}>Regulatory Helpdesk</Text>
                </TouchableOpacity>
                
                <Text style={styles.supportDescription}>
                  Get help with compliance questions, KYC issues, or regulatory updates.
                </Text>
              </CardContent>
            </Card>

            {/* App Info Footer */}
            <View style={styles.footer}>
              <View style={styles.footerDots}>
                <DotMatrix pattern="privacy" size="small" />
              </View>
              <Text style={styles.appVersion}>zkETHer v1.0.0 - Compliant Privacy Protocol</Text>
              <Text style={styles.licensing}>Licensed under India IT Act & EU MiCA</Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  headerIcon: {
    padding: 8,
  },
  dotMatrixContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  kycDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: colors.accent,
    fontFamily: 'monospace',
  },
  checkmark: {
    fontSize: 12,
    color: colors.accent,
  },
  updateButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  switchContent: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 12,
    color: colors.text.primary,
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  mandatoryNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 8,
    gap: 4,
  },
  mandatoryText: {
    fontSize: 10,
    color: colors.text.secondary,
    flex: 1,
  },
  privacyMode: {
    fontSize: 12,
    color: colors.accent,
    fontFamily: 'monospace',
  },
  privacyFeatures: {
    marginTop: 12,
  },
  featureText: {
    fontSize: 10,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  exportButtons: {
    gap: 8,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  exportButtonText: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  supportButtonText: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  supportDescription: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  footerDots: {
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 10,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  licensing: {
    fontSize: 10,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    fontSize: 14,
    color: colors.background,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});
