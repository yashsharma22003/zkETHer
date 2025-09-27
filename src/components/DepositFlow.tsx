import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, TextInput, Animated, Alert, StyleSheet } from 'react-native';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import DotMatrix from './ui/DotMatrix';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useWallet } from '../contexts/WalletContext';
import { useGasPrice, useEstimateGas } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { colors } from '../styles/colors';

interface DepositFlowProps {
  onClose: () => void;
}

type DepositStep = 'form' | 'confirmation' | 'commitment' | 'wallet-approval' | 'blockchain' | 'confirmed' | 'share-note' | 'complete';

export default function DepositFlow({ onClose }: DepositFlowProps) {
  const [step, setStep] = useState<DepositStep>('form');
  const [recipient, setRecipient] = useState('');
  const [progress, setProgress] = useState(0);
  const [nonce, setNonce] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [leafIndex, setLeafIndex] = useState(0);
  const [blockNumber, setBlockNumber] = useState(0);
  const { isKYCCompleted } = useOnboarding();
  const { isConnected, address, balance, walletType } = useWallet();

  // Real-time gas estimation
  const { data: gasPrice } = useGasPrice();
  const { data: gasEstimate } = useEstimateGas({
    to: '0x0000000000000000000000000000000000000000', // Replace with actual zkETHer contract
    value: parseEther('1'),
    account: address as `0x${string}` | undefined,
    enabled: isConnected && !!address,
  });
  
  // Calculations
  const depositAmount = 1.0;
  const gasFeeInWei = gasPrice && gasEstimate ? gasPrice * gasEstimate : 0n;
  const gasFee = gasFeeInWei ? parseFloat(formatEther(gasFeeInWei)) : 0.003; // fallback
  const totalCost = depositAmount + gasFee;

  // Generate mock data
  useEffect(() => {
    if (step === 'commitment') {
      setNonce(Math.random().toString(36).substring(2, 15));
      setTransactionHash('0x' + Math.random().toString(16).substring(2, 66));
      setLeafIndex(Math.floor(Math.random() * 1000) + 100);
      setBlockNumber(Math.floor(Math.random() * 1000000) + 18000000);
    }
  }, [step]);

  // Progress animation for commitment generation
  useEffect(() => {
    if (step === 'commitment') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep('wallet-approval'), 500);
            return 100;
          }
          return prev + 2;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Auto-advance through steps
  useEffect(() => {
    if (step === 'wallet-approval') {
      setTimeout(() => setStep('blockchain'), 3000);
    } else if (step === 'blockchain') {
      setTimeout(() => setStep('confirmed'), 4000);
    }
  }, [step]);

  const handleQRScan = () => {
    Alert.alert('QR Scanner', 'QR scanner functionality would be implemented here');
  };

  const handleContacts = () => {
    Alert.alert('Contacts', 'Contacts selection would be implemented here');
  };

  const handleContinue = () => {
    if (!recipient.trim()) {
      Alert.alert('Error', 'Please enter a recipient address');
      return;
    }
    setStep('confirmation');
  };

  const handleDeposit = () => {
    setStep('commitment');
    setProgress(0);
  };

  const handleShareNote = () => {
    setStep('complete');
  };

  const getCurrentCommitmentStep = () => {
    if (progress < 30) {
      return {
        current: "Generating commitment hash...",
        pending: ["Creating Merkle proof", "Encrypting note data", "Finalizing transaction"]
      };
    } else if (progress < 60) {
      return {
        current: "Creating Merkle proof...",
        pending: ["Encrypting note data", "Finalizing transaction"]
      };
    } else if (progress < 90) {
      return {
        current: "Encrypting note data...",
        pending: ["Finalizing transaction"]
      };
    } else {
      return {
        current: "Finalizing transaction...",
        pending: []
      };
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {step === 'form' && (
            <>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Send ETH Privately</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.content}>
                {/* Send To Section */}
                <View style={styles.section}>
                  <Text style={styles.label}>Send to:</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Bob's zkETHer Public Key (0x1a2b3c4d...)"
                      placeholderTextColor={colors.text.secondary}
                      value={recipient}
                      onChangeText={setRecipient}
                    />
                    <View style={styles.inputIcon}>
                      <DotMatrix pattern="header" size="small" />
                    </View>
                  </View>
                </View>


                {/* Amount Section */}
                <View style={styles.section}>
                  <Text style={styles.label}>Amount: 1.00 ETH (Fixed)</Text>
                  <Card style={styles.amountCard}>
                    <CardContent>
                      <View style={styles.amountContent}>
                        <Text style={styles.amountText}>1.00 ETH</Text>
                        <Text style={styles.amountDots}>•••</Text>
                      </View>
                    </CardContent>
                  </Card>
                </View>

                {/* From Wallet Section */}
                <View style={styles.section}>
                  <Text style={styles.label}>From Wallet:</Text>
                  <Card style={styles.walletCardApproval}>
                    <CardContent>
                      <View style={styles.walletContent}>
                        <View style={styles.walletInfo}>
                          <Text style={styles.walletType}>
                            {isConnected ? `${walletType} (${address?.slice(0, 8)}...)` : 'Not Connected'}
                          </Text>
                          <Text style={styles.walletBalance}>
                            Balance: {isConnected ? `${balance} ETH` : '0.0 ETH'}
                          </Text>
                        </View>
                        <Text style={styles.walletEmoji}>📱</Text>
                      </View>
                    </CardContent>
                  </Card>
                </View>

                {/* Privacy Notice */}
                <View style={styles.privacyNotice}>
                  <Text style={styles.privacyTitleForm}>Privacy Notice:</Text>
                  <View style={styles.privacyItem}>
                    <Text style={styles.warningIcon}>⚠️</Text>
                    <Text style={styles.privacyText}>This deposit will be PUBLIC</Text>
                  </View>
                  <View style={styles.privacyItem}>
                    <Text style={styles.lockIcon}>🔒</Text>
                    <Text style={styles.privacyTextGreen}>Withdrawal will be UNLINKABLE</Text>
                  </View>
                </View>

                {/* Continue Button */}
                <Button
                  title="CONTINUE"
                  onPress={handleContinue}
                  style={styles.continueButton}
                />
              </View>
            </>
          )}

          {step === 'confirmation' && (
            <>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setStep('form')} style={styles.backButton}>
                  <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Confirm Deposit</Text>
                <View style={styles.placeholder} />
              </View>
              
              <View style={styles.content}>
                {/* Dot Matrix */}
                <View style={styles.dotMatrixCenter}>
                  <DotMatrix pattern="privacy" size="medium" />
                </View>

                {/* Creating Private Note */}
                <View style={styles.centerSection}>
                  <Text style={styles.noteTitle}>Creating Private Note</Text>
                  <Text style={styles.noteSubtitle}>For: Bob ({recipient?.slice(0, 12)}...)</Text>
                  <Text style={styles.noteAmount}>Amount: 1.00 ETH</Text>
                </View>

                {/* Transaction Details Card */}
                <Card style={styles.detailsCard}>
                  <CardContent>
                    <Text style={styles.detailsTitle}>Transaction Details:</Text>
                    
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Amount:</Text>
                      <Text style={styles.detailsValue}>1.00 ETH</Text>
                    </View>
                    
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Gas Fee:</Text>
                      <Text style={styles.detailsValue}>{gasFee.toFixed(6)} ETH</Text>
                    </View>
                    
                    <View style={[styles.detailsRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Total Cost:</Text>
                      <Text style={styles.totalValue}>{totalCost.toFixed(6)} ETH</Text>
                    </View>

                    <View style={styles.featureSection}>
                      <Text style={styles.featureTitle}>Privacy Features:</Text>
                      <Text style={styles.featureItem}>✓ Anonymous withdrawal</Text>
                      <Text style={styles.featureItem}>✓ Zero-knowledge proofs</Text>
                      <Text style={styles.featureItem}>✓ Unlinkable transactions</Text>
                    </View>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <View style={styles.confirmButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelButtonText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.depositButton} onPress={handleDeposit}>
                    <Text style={styles.depositButtonText}>DEPOSIT</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* Commitment Generation Screen */}
          {step === 'commitment' && (
            <View style={styles.content}>
              <View style={styles.centerSection}>
                <Text style={styles.title}>Generating Commitment...</Text>
                <View style={styles.dotMatrixCenter}>
                  <DotMatrix pattern="privacy" size="small" />
                </View>
                
                <Card style={styles.commitmentGrid}>
                  <CardContent style={styles.commitmentGridContent}>
                    <DotMatrix pattern="commitment" />
                  </CardContent>
                </Card>
                
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                </View>

                <View style={styles.stepsList}>
                  {getCurrentCommitmentStep().current && (
                    <View style={styles.stepCurrent}>
                      <View style={styles.stepDotActive} />
                      <Text style={styles.stepTextActive}>● {getCurrentCommitmentStep().current}</Text>
                    </View>
                  )}
                  {getCurrentCommitmentStep().pending.map((step, i) => (
                    <View key={i} style={styles.stepPending}>
                      <View style={styles.stepDotPending} />
                      <Text style={styles.stepTextPending}>○ {step}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.commitmentInfo}>
                  <Text style={styles.commitmentLabel}>Creating note for {recipient || 'Bob'}...</Text>
                  <Text style={styles.commitmentNonce}>
                    Nonce: {nonce}... <DotMatrix pattern="header" size="small" />
                  </Text>
                  <Text style={styles.commitmentTime}>
                    Time remaining: ~{Math.max(1, Math.floor((100 - progress) / 40))} seconds
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Wallet Approval Screen */}
          {step === 'wallet-approval' && (
            <View style={styles.content}>
              <View style={styles.centerSection}>
                <Text style={styles.title}>Approve in Wallet...</Text>
                <View style={styles.dotMatrixCenter}>
                  <DotMatrix pattern="privacy" size="small" />
                </View>
                
                <Text style={styles.successText}>Commitment Generated ✓</Text>

                <Card style={styles.walletCardApproval}>
                  <CardContent style={styles.walletCardContent}>
                    <Text style={styles.walletIcon}>📱 {isConnected ? walletType : 'Not Connected'}</Text>
                    <Text style={styles.walletTitle}>zkETHer Deposit</Text>
                    <View style={styles.walletDetails}>
                      <Text style={styles.walletDetailText}>To: 0x...contract</Text>
                      <Text style={styles.walletDetailText}>Amount: 1.00 ETH</Text>
                      <Text style={styles.walletDetailText}>Gas: {gasFee.toFixed(6)} ETH</Text>
                    </View>
                    <Text style={styles.walletData}>Data: {nonce}...</Text>
                    <View style={styles.walletButtons}>
                      <TouchableOpacity style={styles.walletRejectButton}>
                        <Text style={styles.walletRejectText}>REJECT</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.walletConfirmButton}>
                        <Text style={styles.walletConfirmText}>CONFIRM</Text>
                      </TouchableOpacity>
                    </View>
                  </CardContent>
                </Card>
                
                <View style={styles.waitingInfo}>
                  <Text style={styles.waitingText}>Waiting for wallet approval...</Text>
                  <Text style={styles.waitingNote}>Note: This transaction will be publicly visible on Ethereum</Text>
                </View>
              </View>
            </View>
          )}

          {/* Blockchain Screen */}
          {step === 'blockchain' && (
            <View style={styles.content}>
              <View style={styles.centerSection}>
                <Text style={styles.title}>Broadcasting Transaction...</Text>
                <View style={styles.dotMatrixCenter}>
                  <DotMatrix pattern="privacy" size="small" />
                </View>
                
                <Text style={styles.networkStatus}>Ethereum Network: Confirming</Text>

                <Card style={styles.networkCard}>
                  <CardContent style={styles.networkCardContent}>
                    <DotMatrix pattern="network" />
                  </CardContent>
                </Card>
                
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionLabel}>Transaction Hash:</Text>
                  <Text style={styles.transactionHash}>{transactionHash}</Text>
                  
                  <View style={styles.transactionStatus}>
                    <Text style={styles.statusText}>Status: Pending...</Text>
                    <Text style={styles.statusText}>Block: Waiting for inclusion</Text>
                    <Text style={styles.statusText}>Confirmations: 0/3</Text>
                  </View>
                </View>
                
                <TouchableOpacity style={styles.etherscanButton}>
                  <Text style={styles.etherscanText}>VIEW ON ETHERSCAN</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Transaction Confirmed Screen */}
          {step === 'confirmed' && (
            <View style={styles.content}>
              <View style={styles.centerSection}>
                <Text style={styles.titleSuccess}>Transaction Confirmed ✓</Text>
                <View style={styles.dotMatrixCenter}>
                  <DotMatrix pattern="privacy" size="small" />
                </View>
                
                <Text style={styles.poolStatus}>Added to zkETHer Pool</Text>

                <Card style={styles.confirmedCard}>
                  <CardContent style={styles.confirmedCardContent}>
                    <Text style={styles.commitmentHash}>Commitment: {nonce}...</Text>
                    <Text style={styles.leafIndexText}>Leaf Index: #{leafIndex}</Text>
                    <Text style={styles.blockText}>Block: #{blockNumber}</Text>
                    
                    <View style={styles.poolSection}>
                      <Text style={styles.poolTitle}>Privacy Pool Status:</Text>
                      <Text style={styles.poolDetail}>Total Deposits: {leafIndex}</Text>
                      <Text style={styles.poolDetail}>Anonymity Set: +1 user</Text>
                      <View style={styles.dotMatrixSmall}>
                        <DotMatrix pattern="privacy" size="small" />
                      </View>
                    </View>
                  </CardContent>
                </Card>
                
                <Text style={styles.nextStep}>Next Step: Share note with {recipient || 'Bob'}</Text>
                
                <View style={styles.confirmedButtons}>
                  <TouchableOpacity style={styles.viewTransactionButton}>
                    <Text style={styles.viewTransactionText}>VIEW TRANSACTION</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.shareNoteButton} onPress={() => setStep('share-note')}>
                    <Text style={styles.shareNoteText}>SHARE NOTE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.backHomeButton} onPress={onClose}>
                    <Text style={styles.backHomeText}>BACK TO HOME</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Share Note Screen */}
          {step === 'share-note' && (
            <View style={styles.content}>
              <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => setStep('confirmed')}>
                  <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Share Note with {recipient || 'Bob'}</Text>
                <View style={styles.placeholder} />
              </View>
              
              <View style={styles.dotMatrixCenter}>
                <DotMatrix pattern="privacy" size="small" />
              </View>
              
              <Text style={styles.shareInstructions}>
                {recipient || 'Bob'} needs this information to discover the note:
              </Text>
              
              <Card style={styles.shareCard}>
                <CardContent style={styles.shareCardContent}>
                  <View style={styles.shareDetails}>
                    <Text style={styles.shareDetailText}>Amount: 1.00 ETH</Text>
                    <Text style={styles.shareDetailText}>Nonce: {nonce}</Text>
                    <Text style={styles.shareDetailText}>Leaf Index: #{leafIndex}</Text>
                  </View>
                  
                  <View style={styles.warningBox}>
                    <Text style={styles.warningTitle}>⚠️ KEEP THIS PRIVATE</Text>
                    <Text style={styles.warningText}>
                      Only share via secure channels (Signal, etc.)
                    </Text>
                  </View>
                </CardContent>
              </Card>
              
              <View style={styles.sharingOptions}>
                <Text style={styles.optionsLabel}>Sharing Options:</Text>
                <TouchableOpacity style={styles.shareOption}>
                  <Text style={styles.shareOptionText}>💬 Send via Signal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareOption}>
                  <Text style={styles.shareOptionText}>📧 Encrypted Email</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareOption}>
                  <Text style={styles.shareOptionText}>📋 Copy to Clipboard</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareOption}>
                  <Text style={styles.shareOptionText}>🔗 Generate Secure Link</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareOption}>
                  <Text style={styles.shareOptionText}>⏰ Auto-delete after 24h</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.shareButtons}>
                <TouchableOpacity style={styles.skipButton} onPress={handleShareNote}>
                  <Text style={styles.skipText}>SKIP FOR NOW</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareConfirmButton} onPress={handleShareNote}>
                  <Text style={styles.shareConfirmText}>SHARE</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Complete Screen */}
          {step === 'complete' && (
            <View style={styles.content}>
              <View style={styles.centerSection}>
                <View style={styles.successIcon}>
                  <Text style={styles.successIconText}>✓</Text>
                </View>

                <Text style={styles.titleSuccess}>Deposit Successful</Text>
                <View style={styles.dotMatrixCenter}>
                  <DotMatrix pattern="privacy" size="small" />
                </View>

                <Card style={styles.completeCard}>
                  <CardContent style={styles.completeCardContent}>
                    <Text style={styles.completeStatus}>COMPLETE</Text>
                    <View style={styles.completeDetails}>
                      <Text style={styles.completeAmount}>1.00 ETH Deposited</Text>
                      <Text style={styles.completeRecipient}>For: {recipient || 'Bob'}</Text>
                    </View>
                    
                    <View style={styles.privacyStatus}>
                      <Text style={styles.privacyTitleConfirmed}>Privacy Pool Status:</Text>
                      <Text style={styles.privacyDetail}>Added to anonymity set of {leafIndex} users</Text>
                      <View style={styles.dotMatrixSmall}>
                        <DotMatrix pattern="privacy" size="small" />
                      </View>
                    </View>
                  </CardContent>
                </Card>
                
                <View style={styles.nextSteps}>
                  <Text style={styles.nextStepsTitle}>What happens next:</Text>
                  <View style={styles.nextStepsList}>
                    <Text style={styles.nextStepItem}>• {recipient || 'Bob'}'s app will scan deposits</Text>
                    <Text style={styles.nextStepItem}>• Trial decryption will find your note automatically</Text>
                    <Text style={styles.nextStepItem}>• {recipient || 'Bob'} can withdraw unlinkably</Text>
                  </View>
                </View>
                
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDetailText}>Transaction: {transactionHash.slice(0, 12)}...</Text>
                  <Text style={styles.transactionDetailText}>Block: #{blockNumber}</Text>
                  <Text style={styles.transactionDetailText}>Gas Used: 21,234</Text>
                </View>
                
                <View style={styles.completeButtons}>
                  <TouchableOpacity style={styles.viewTransactionButton}>
                    <Text style={styles.viewTransactionText}>VIEW TRANSACTION</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sendAnotherButton}>
                    <Text style={styles.sendAnotherText}>SEND ANOTHER</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.finalBackButton} onPress={onClose}>
                    <Text style={styles.finalBackText}>BACK TO HOME</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: colors.text.primary,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text.primary,
    fontFamily: 'monospace',
    paddingRight: 40,
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  amountCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  amountDots: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  walletCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletInfo: {
    flex: 1,
  },
  walletType: {
    fontSize: 14,
    color: colors.text.primary,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  walletEmoji: {
    fontSize: 16,
  },
  privacyNotice: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  privacyTitleForm: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  warningIcon: {
    fontSize: 12,
    marginRight: 8,
  },
  lockIcon: {
    fontSize: 12,
    marginRight: 8,
  },
  privacyText: {
    fontSize: 12,
    color: colors.text.primary,
  },
  privacyTextGreen: {
    fontSize: 12,
    color: '#22c55e',
  },
  continueButton: {
    marginTop: 20,
  },
  // Confirmation screen styles
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 18,
    color: colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  dotMatrixCenter: {
    alignItems: 'center',
    marginBottom: 20,
  },
  centerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  noteSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  noteAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailsLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  detailsValue: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  featureSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 12,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  featureItem: {
    fontSize: 11,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  anonymityCount: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  dotMatrixSmall: {
    alignItems: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  depositButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  depositButtonText: {
    fontSize: 14,
    color: colors.background,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  // Progress and commitment styles
  progressContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  stepsList: {
    marginBottom: 20,
  },
  stepCurrent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 16,
  },
  stepPending: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 16,
  },
  stepDotActive: {
    width: 8,
    height: 8,
    backgroundColor: colors.accent,
    borderRadius: 4,
    marginRight: 8,
  },
  stepDotPending: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: colors.text.secondary,
    borderRadius: 4,
    marginRight: 8,
  },
  stepTextActive: {
    fontSize: 12,
    color: colors.accent,
  },
  stepTextPending: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  commitmentInfo: {
    alignItems: 'center',
  },
  commitmentLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  commitmentNonce: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  commitmentTime: {
    fontSize: 14,
    color: colors.accent,
    fontFamily: 'monospace',
  },
  // Wallet approval styles
  successText: {
    fontSize: 14,
    color: colors.accent,
    marginBottom: 16,
  },
  walletCardApproval: {
    marginBottom: 16,
  },
  walletCardContent: {
    padding: 16,
    alignItems: 'center',
  },
  walletIcon: {
    fontSize: 18,
    marginBottom: 8,
  },
  walletTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  walletDetails: {
    marginBottom: 12,
  },
  walletDetailText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  walletData: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  walletButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
  },
  walletRejectButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  walletRejectText: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  walletConfirmButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  walletConfirmText: {
    fontSize: 12,
    color: colors.background,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  waitingInfo: {
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  waitingNote: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  // Blockchain styles
  networkStatus: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  networkCard: {
    marginBottom: 16,
  },
  networkCardContent: {
    padding: 16,
    alignItems: 'center',
  },
  transactionInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionLabel: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 8,
  },
  transactionHash: {
    fontSize: 12,
    color: colors.accent,
    fontFamily: 'monospace',
    marginBottom: 12,
    textAlign: 'center',
  },
  transactionStatus: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  etherscanButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  etherscanText: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  // Confirmed styles
  titleSuccess: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  poolStatus: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  confirmedCard: {
    marginBottom: 16,
  },
  confirmedCardContent: {
    padding: 16,
  },
  commitmentHash: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  leafIndexText: {
    fontSize: 12,
    color: colors.text.primary,
    marginBottom: 8,
  },
  blockText: {
    fontSize: 12,
    color: colors.text.primary,
    marginBottom: 12,
  },
  poolSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  poolTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  poolDetail: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  nextStep: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmedButtons: {
    gap: 8,
  },
  viewTransactionButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  viewTransactionText: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  shareNoteButton: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  shareNoteText: {
    fontSize: 14,
    color: colors.background,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  backHomeButton: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    alignItems: 'center',
  },
  backHomeText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  // Share note styles
  shareInstructions: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  shareCard: {
    marginBottom: 16,
  },
  shareCardContent: {
    padding: 16,
  },
  shareDetails: {
    marginBottom: 12,
  },
  shareDetailText: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  warningBox: {
    backgroundColor: '#ef444420',
    borderWidth: 1,
    borderColor: '#ef444430',
    borderRadius: 6,
    padding: 8,
    marginTop: 12,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 10,
    color: '#ef444480',
  },
  sharingOptions: {
    marginBottom: 16,
  },
  optionsLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  shareOption: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  shareOptionText: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  shareConfirmButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareConfirmText: {
    fontSize: 14,
    color: colors.background,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  // Complete styles
  successIcon: {
    width: 64,
    height: 64,
    backgroundColor: colors.accent,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIconText: {
    fontSize: 24,
    color: colors.background,
    fontWeight: 'bold',
  },
  completeCard: {
    marginBottom: 16,
  },
  completeCardContent: {
    padding: 16,
    alignItems: 'center',
  },
  completeStatus: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  completeDetails: {
    alignItems: 'center',
    marginBottom: 12,
  },
  completeAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  completeRecipient: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  privacyStatus: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    alignItems: 'center',
  },
  privacyTitleConfirmed: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  privacyDetail: {
    fontSize: 10,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  nextSteps: {
    marginBottom: 16,
  },
  nextStepsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  nextStepsList: {
    alignItems: 'flex-start',
  },
  nextStepItem: {
    fontSize: 10,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  transactionDetails: {
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionDetailText: {
    fontSize: 10,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  completeButtons: {
    gap: 8,
  },
  sendAnotherButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  sendAnotherText: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  finalBackButton: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  finalBackText: {
    fontSize: 14,
    color: colors.background,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  
  // Commitment grid styles
  commitmentGrid: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
    alignItems: 'center',
  },
  commitmentGridContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
