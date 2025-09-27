import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  StatusBar,
} from 'react-native';
import { useOnboarding } from '../contexts/OnboardingContext';
import { colors } from '../styles/colors';
import { Card, CardContent } from './ui/Card';
import DotMatrix from './ui/DotMatrix';
import { 
  ArrowLeftIcon, 
  ShieldIcon, 
  UserIcon, 
  FileTextIcon, 
  DownloadIcon,
  HelpCircleIcon
} from './ui/Icons';

interface ComplianceDashboardProps {
  visible: boolean;
  onClose: () => void;
}

export default function ComplianceDashboard({ visible, onClose }: ComplianceDashboardProps) {
  const { isKYCCompleted, kycData } = useOnboarding();
  const [isExporting, setIsExporting] = useState(false);

  // Mock compliance data matching PWA
  const complianceData = {
    totalTDSPaid: 0.05,
    transactionsReported: 12,
    complianceScore: 100,
    lastAudit: "Nov 2024",
    kycValidUntil: "Dec 2024",
    regulatoryFramework: ["EU MiCA", "India IT Act", "ERC-3643"]
  };

  const handleExportCertificate = async () => {
    setIsExporting(true);
    // Simulate export process
    setTimeout(() => {
      console.log('Tax Certificate Generated');
      setIsExporting(false);
    }, 2000);
  };

  const handleExportReport = () => {
    console.log('Export Compliance Report clicked');
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
          <View style={styles.headerTitle}>
            <ShieldIcon size={20} color={colors.accent} />
            <Text style={styles.headerTitleText}>Regulatory Compliance</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            
            {/* ERC-3643 Token Compliance */}
            <Card style={styles.sectionCard}>
              <CardContent style={styles.cardContent}>
                <View style={styles.sectionHeader}>
                  <View style={styles.iconContainer}>
                    <ShieldIcon size={16} color={colors.accent} />
                  </View>
                  <View style={styles.sectionTitleContainer}>
                    <Text style={styles.sectionTitle}>Token Compliance</Text>
                    <Text style={styles.sectionSubtitle}>ERC-3643 Permissioned</Text>
                  </View>
                </View>
                
                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={styles.detailValueAccent}>✓ Institutional Grade</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Permission Level:</Text>
                    <Text style={styles.detailValue}>Verified Investor</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* KYC Status */}
            {isKYCCompleted && (
              <Card style={styles.sectionCard}>
                <CardContent style={styles.cardContent}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.iconContainer}>
                      <UserIcon size={16} color={colors.accent} />
                    </View>
                    <View style={styles.sectionTitleContainer}>
                      <Text style={styles.sectionTitle}>KYC Status</Text>
                      <Text style={styles.sectionSubtitle}>Identity Verification</Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Status:</Text>
                      <Text style={styles.detailValueAccent}>✓ Verified</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Valid Until:</Text>
                      <Text style={styles.detailValue}>{complianceData.kycValidUntil}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Name:</Text>
                      <Text style={styles.detailValueSmall}>{kycData?.fullName || 'Shreyansh Singh'}</Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            )}

            {/* Tax Summary */}
            <Card style={styles.sectionCard}>
              <CardContent style={styles.cardContent}>
                <View style={styles.sectionHeader}>
                  <View style={styles.iconContainer}>
                    <FileTextIcon size={16} color={colors.accent} />
                  </View>
                  <View style={styles.sectionTitleContainer}>
                    <Text style={styles.sectionTitle}>Tax Summary</Text>
                    <Text style={styles.sectionSubtitle}>TDS & Reporting</Text>
                  </View>
                </View>
                
                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total TDS Paid:</Text>
                    <Text style={styles.detailValue}>{complianceData.totalTDSPaid.toFixed(3)} ETH</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transactions Reported:</Text>
                    <Text style={styles.detailValue}>{complianceData.transactionsReported}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reporting Entity:</Text>
                    <Text style={styles.detailValueSmall}>FIU-India</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Regulatory Framework */}
            <Card style={styles.sectionCard}>
              <CardContent style={styles.cardContent}>
                <Text style={styles.frameworkTitle}>Regulatory Framework</Text>
                <View style={styles.frameworkList}>
                  {complianceData.regulatoryFramework.map((framework, index) => (
                    <View key={index} style={styles.frameworkItem}>
                      <Text style={styles.checkmark}>✓</Text>
                      <Text style={styles.frameworkText}>{framework} Compliant</Text>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>

            {/* Compliance Score */}
            <Card style={styles.sectionCard}>
              <CardContent style={styles.cardContent}>
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreValue}>{complianceData.complianceScore}%</Text>
                  <Text style={styles.scoreLabel}>Compliance Score</Text>
                  <View style={styles.scoreDots}>
                    <DotMatrix pattern="privacy" size="small" />
                  </View>
                  <Text style={styles.auditText}>Last Audit: {complianceData.lastAudit}</Text>
                </View>
              </CardContent>
            </Card>

            {/* Recent AML Reports */}
            <Card style={styles.sectionCard}>
              <CardContent style={styles.cardContent}>
                <Text style={styles.reportsTitle}>Recent AML Reports</Text>
                <View style={styles.reportsList}>
                  <View style={styles.reportItem}>
                    <Text style={styles.reportDate}>Nov 2024 - Deposit Report</Text>
                    <Text style={styles.reportStatus}>✓ Filed</Text>
                  </View>
                  <View style={styles.reportItem}>
                    <Text style={styles.reportDate}>Oct 2024 - Withdrawal Report</Text>
                    <Text style={styles.reportStatus}>✓ Filed</Text>
                  </View>
                  <View style={styles.reportItem}>
                    <Text style={styles.reportDate}>Sep 2024 - Monthly Summary</Text>
                    <Text style={styles.reportStatus}>✓ Filed</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Export Actions */}
            <View style={styles.exportSection}>
              <TouchableOpacity 
                style={[styles.exportButton, styles.primaryButton]} 
                onPress={handleExportCertificate}
                disabled={isExporting}
              >
                <DownloadIcon size={16} color={colors.background} />
                <Text style={styles.primaryButtonText}>
                  {isExporting ? "Generating..." : "Download Tax Certificate"}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.exportButton, styles.secondaryButton]} 
                onPress={handleExportReport}
              >
                <Text style={styles.secondaryButtonText}>Export Compliance Report</Text>
              </TouchableOpacity>
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                All transactions are automatically reported to relevant regulatory authorities. 
                This mixer operates under institutional compliance frameworks.
              </Text>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  headerSpacer: {
    width: 40,
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
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    backgroundColor: colors.accent + '20',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  detailValueAccent: {
    fontSize: 12,
    color: colors.accent,
    fontFamily: 'monospace',
  },
  detailValueSmall: {
    fontSize: 10,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  frameworkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  frameworkList: {
    gap: 8,
  },
  frameworkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkmark: {
    fontSize: 12,
    color: colors.accent,
  },
  frameworkText: {
    fontSize: 10,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.accent,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  scoreDots: {
    marginBottom: 12,
  },
  auditText: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  reportsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  reportsList: {
    gap: 8,
  },
  reportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportDate: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  reportStatus: {
    fontSize: 10,
    color: colors.accent,
  },
  exportSection: {
    gap: 12,
    marginBottom: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: colors.accent,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButtonText: {
    fontSize: 14,
    color: colors.background,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  secondaryButtonText: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  disclaimer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
  },
  disclaimerText: {
    fontSize: 10,
    color: colors.text.secondary,
    lineHeight: 14,
  },
});
