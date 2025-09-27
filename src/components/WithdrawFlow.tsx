import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Animated, Alert } from 'react-native';
import { colors } from '../styles/colors';
import { useOnboarding } from '../contexts/OnboardingContext';
import DotMatrix from './ui/DotMatrix';
import Card, { CardContent } from './ui/Card';
import Button from './ui/Button';
import { ShieldIcon, AlertTriangleIcon } from './ui/Icons';
import { zkETHerEventListener } from '../services/zkETHerEventListener';
import { noteStorageService, type StoredNote } from '../services/noteStorageService';

interface WithdrawFlowProps {
  onClose: () => void;
}

type WithdrawStep = 'note-selection' | 'confirmation' | 'zkproof' | 'relayer' | 'blockchain' | 'complete';

interface MockNote {
  id: string;
  amount: number;
  received: string;
  privacySet: number;
  isRecommended: boolean;
}

export default function WithdrawFlow({ onClose }: WithdrawFlowProps) {
  const [step, setStep] = useState<WithdrawStep>('note-selection');
  const [selectedNote, setSelectedNote] = useState<StoredNote | null>(null);
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [progress, setProgress] = useState(0);
  const [transactionHash, setTransactionHash] = useState('');
  const [blockNumber, setBlockNumber] = useState(0);
  const [realNotes, setRealNotes] = useState<StoredNote[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isKYCCompleted } = useOnboarding();

  // Animation for the highlighted merkle node
  const nodeAnimation = new Animated.Value(0.4);
  const nodeScale = new Animated.Value(0.8);

  // Initialize zkETHer event listener and load notes
  useEffect(() => {
    initializeWithdrawFlow();
    return () => {
      zkETHerEventListener.stopListening();
    };
  }, []);

  // Start animation when in zkproof step
  useEffect(() => {
    if (step === 'zkproof') {
      const animateNode = () => {
        Animated.parallel([
          Animated.sequence([
            Animated.timing(nodeAnimation, {
              toValue: 1,
              duration: 750,
              useNativeDriver: false,
            }),
            Animated.timing(nodeAnimation, {
              toValue: 0.4,
              duration: 750,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(nodeScale, {
              toValue: 1.4,
              duration: 750,
              useNativeDriver: false,
            }),
            Animated.timing(nodeScale, {
              toValue: 0.8,
              duration: 750,
              useNativeDriver: false,
            }),
          ]),
        ]).start(() => {
          if (step === 'zkproof') {
            animateNode();
          }
        });
      };
      animateNode();
    }
  }, [step, nodeAnimation, nodeScale]);

  const initializeWithdrawFlow = async () => {
    try {
      console.log('🚀 Initializing zkETHer withdrawal flow...');
      setIsLoading(true);
      
      // Load existing notes
      console.log('📂 Loading existing notes from secure storage...');
      await loadNotes();
      
      // Start event listener for new deposits
      console.log('🎧 Starting zkETHer event listener...');
      await startEventListener();
      
      console.log('✅ Withdrawal flow initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize withdraw flow:', error);
      Alert.alert('Error', 'Failed to initialize withdrawal system');
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      console.log('📖 Fetching notes from secure storage...');
      const notes = await noteStorageService.getNotes();
      console.log(`📊 Found ${notes.length} total notes in storage`);
      
      setRealNotes(notes);
      
      if (notes.length > 0 && !selectedNote) {
        setSelectedNote(notes[0]);
        console.log('🎯 Auto-selected first available note:', notes[0].commitment.slice(0, 10) + '...');
      }
      
      console.log(`📝 Loaded ${notes.length} available notes for withdrawal`);
    } catch (error) {
      console.error('❌ Failed to load notes:', error);
    }
  };

  const startEventListener = async () => {
    try {
      console.log('🔍 Checking zkETHer event listener status...');
      console.log('📍 Contract address:', '0xf14042705C90aF524CB75d1c90A2Eb567F74eC60');
      console.log('🌐 Network: Ethereum Sepolia');
      console.log('🔗 RPC: https://eth-sepolia.public.blastapi.io');
      
      if (!zkETHerEventListener.isListening) {
        console.log('🆕 Starting new event listener instance...');
        
        // Subscribe to note updates
        zkETHerEventListener.onNotesUpdated((newNotes) => {
          console.log(`🔄 Notes updated: ${newNotes.length} available`);
          // Convert BobsNote[] to StoredNote[] by adding id field
          const storedNotes: StoredNote[] = newNotes.map((note, index) => ({
            ...note,
            id: `${note.commitment}_${index}`
          }));
          setRealNotes(storedNotes);
          
          // Auto-select first note if none selected
          if (storedNotes.length > 0 && !selectedNote) {
            setSelectedNote(storedNotes[0]);
            console.log('🎯 Auto-selected new note:', storedNotes[0].commitment.slice(0, 10) + '...');
          }
        });
        
        // Start listening to blockchain events (if not already started by background service)
        await zkETHerEventListener.startListening();
        setIsListening(true);
        
        console.log('🎧 zkETHer event listener connected to withdrawal flow');
      } else {
        console.log('♻️ Event listener already running in background, connecting...');
        
        // Already listening in background, just subscribe to updates
        zkETHerEventListener.onNotesUpdated((newNotes) => {
          console.log(`🔄 Notes updated from background listener: ${newNotes.length} available`);
          const storedNotes: StoredNote[] = newNotes.map((note, index) => ({
            ...note,
            id: `${note.commitment}_${index}`
          }));
          setRealNotes(storedNotes);
          
          if (storedNotes.length > 0 && !selectedNote) {
            setSelectedNote(storedNotes[0]);
            console.log('🎯 Auto-selected note from background:', storedNotes[0].commitment.slice(0, 10) + '...');
          }
        });
        setIsListening(true);
        console.log('🔗 Connected to existing background zkETHer event listener');
      }
    } catch (error) {
      console.error('❌ Failed to start event listener:', error);
      console.error('Error details:', error);
      // Continue without live updates
    }
  };

  // Mock notes for demonstration
  const mockNotes: MockNote[] = [
    {
      id: '1',
      amount: 1.0,
      received: '2 days ago',
      privacySet: 47293,
      isRecommended: false
    },
    {
      id: '2', 
      amount: 1.0,
      received: '5 hours ago',
      privacySet: 47295,
      isRecommended: true
    }
  ];

  const handleContinue = () => {
    if (!selectedNote || !withdrawalAddress) {
      Alert.alert('Missing Information', 'Please select a note and enter withdrawal address');
      return;
    }
    setStep('confirmation');
  };

  const handleNoteSelection = (note: StoredNote) => {
    setSelectedNote(note);
    console.log('📝 Selected note:', {
      id: note.id,
      amount: note.amount,
      commitment: note.commitment.slice(0, 10) + '...'
    });
  };

  const handleConfirmWithdrawal = async () => {
    if (!selectedNote) return;
    
    try {
      setStep('zkproof');
      
      // Generate mock data
      const mockTxHash = `0x71d46bffa0b648${Math.random().toString(16).slice(2, 8)}`;
      const mockBlock = 18500375 + Math.floor(Math.random() * 1000);
      
      setTransactionHash(mockTxHash);
      setBlockNumber(mockBlock);
      
      console.log('🔄 Starting withdrawal process for note:', selectedNote.commitment.slice(0, 10) + '...');
      
      // Simulate ZK proof generation progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setStep('relayer');
            
            // Auto proceed to blockchain after relayer
            setTimeout(() => {
              setStep('blockchain');
              
              // Auto proceed to complete after blockchain
              setTimeout(async () => {
                // Mark note as spent in storage
                await noteStorageService.markNoteAsSpent(selectedNote.commitment);
                zkETHerEventListener.markNoteAsSpent(selectedNote.commitment);
                
                setStep('complete');
                console.log('✅ Withdrawal completed for note:', selectedNote.commitment.slice(0, 10) + '...');
              }, 3000);
            }, 3000);
            
            return 100;
          }
          return prev + Math.random() * 6;
        });
      }, 300);
    } catch (error) {
      console.error('❌ Withdrawal failed:', error);
      Alert.alert('Withdrawal Failed', 'Please try again');
    }
  };

  const getCurrentZKStep = () => {
    if (progress < 15) return { current: 'Merkle Path Construction', completed: [], pending: ['Merkle Path Construction', 'Nullifier Generation', 'Witness Generation', 'Constraint Satisfaction', 'Groth16 Proving', 'Verification'] };
    if (progress < 30) return { current: 'Nullifier Generation', completed: ['Merkle Path Construction'], pending: ['Nullifier Generation', 'Witness Generation', 'Constraint Satisfaction', 'Groth16 Proving', 'Verification'] };
    if (progress < 50) return { current: 'Witness Generation (3/4)', completed: ['Merkle Path Construction', 'Nullifier Generation'], pending: ['Witness Generation', 'Constraint Satisfaction', 'Groth16 Proving', 'Verification'] };
    if (progress < 70) return { current: 'Constraint Satisfaction', completed: ['Merkle Path Construction', 'Nullifier Generation', 'Witness Generation'], pending: ['Constraint Satisfaction', 'Groth16 Proving', 'Verification'] };
    if (progress < 90) return { current: 'Groth16 Proving', completed: ['Merkle Path Construction', 'Nullifier Generation', 'Witness Generation', 'Constraint Satisfaction'], pending: ['Groth16 Proving', 'Verification'] };
    return { current: 'Verification', completed: ['Merkle Path Construction', 'Nullifier Generation', 'Witness Generation', 'Constraint Satisfaction', 'Groth16 Proving'], pending: ['Verification'] };
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          {step === 'note-selection' && (
            <>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Select Note to Withdraw</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.content}>
                {/* Available Notes */}
                <View style={styles.centerSection}>
                  <Text style={styles.availableNotes}>Available Notes: {realNotes.length}</Text>
                  <View style={styles.dotMatrixCenter}>
                    <DotMatrix pattern="privacy" size="small" />
                  </View>
                  {isLoading && (
                    <Text style={styles.loadingText}>Loading notes...</Text>
                  )}
                  {!isLoading && realNotes.length === 0 && (
                    <Text style={styles.noNotesText}>No notes available for withdrawal</Text>
                  )}
                </View>

                {/* Note Selection */}
                <View style={styles.notesContainer}>
                  {realNotes.map((note) => {
                    const displayNote = noteStorageService.formatNoteForDisplay(note);
                    return (
                      <TouchableOpacity
                        key={note.id}
                        style={[
                          styles.noteCard,
                          selectedNote?.id === note.id && styles.noteCardSelected
                        ]}
                        onPress={() => handleNoteSelection(note)}
                      >
                        <View style={styles.noteContent}>
                          <View style={[
                            styles.radioButton,
                            selectedNote?.id === note.id && styles.radioButtonSelected
                          ]} />
                          <View style={styles.noteDetails}>
                            <View style={styles.noteHeader}>
                              <Text style={styles.noteTitle}>{displayNote.title}</Text>
                              {displayNote.isRecommended && (
                                <View style={styles.recommendedBadge}>
                                  <Text style={styles.recommendedText}>✓ RECOMMENDED</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.noteAmount}>{displayNote.amount}</Text>
                            <Text style={styles.noteReceived}>{displayNote.timeAgo}</Text>
                            <Text style={styles.notePrivacySet}>{displayNote.privacySet}</Text>
                            <View style={styles.dotMatrixSmall}>
                              <DotMatrix pattern="privacy" size="small" />
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Withdrawal Address */}
                <View style={styles.addressSection}>
                  <Text style={styles.addressLabel}>Withdraw to Address:</Text>
                  <TextInput
                    style={styles.addressInput}
                    placeholder="0x789def..."
                    value={withdrawalAddress}
                    onChangeText={setWithdrawalAddress}
                    placeholderTextColor={colors.text.secondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Continue Button */}
                <Button
                  title="CONTINUE"
                  onPress={handleContinue}
                  style={[
                    styles.continueButton,
                    (!selectedNote || !withdrawalAddress) && styles.continueButtonDisabled
                  ]}
                  disabled={!selectedNote || !withdrawalAddress}
                />
              </View>
            </>
          )}

          {step === 'confirmation' && (
            <>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setStep('note-selection')} style={styles.backButton}>
                  <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Confirm Withdrawal</Text>
                <View style={styles.placeholder} />
              </View>
              
              <View style={styles.content}>
                {/* Withdrawal Details */}
                <View style={styles.centerSection}>
                  <Text style={styles.withdrawTitle}>Withdrawing {selectedNote ? noteStorageService.formatNoteForDisplay(selectedNote).title : 'Note'}</Text>
                  <Text style={styles.withdrawAmount}>Amount: {selectedNote?.amount} ETH</Text>
                  <Text style={styles.withdrawTo}>To: {withdrawalAddress?.slice(0, 12)}...</Text>
                </View>

                {/* Privacy Analysis Card */}
                <Card style={styles.analysisCard}>
                  <CardContent>
                    <Text style={styles.analysisTitle}>Privacy Analysis:</Text>
                    
                    <View style={styles.analysisRow}>
                      <Text style={styles.analysisLabel}>Anonymity Set:</Text>
                      <Text style={styles.analysisValue}>{selectedNote ? noteStorageService.formatNoteForDisplay(selectedNote).privacySet.split(',')[0] : '47,293'} users</Text>
                    </View>
                    
                    <View style={styles.analysisRow}>
                      <Text style={styles.analysisLabel}>Your Unlinkability:</Text>
                      <Text style={styles.analysisValueGreen}>99.998%</Text>
                    </View>
                    
                    <View style={styles.dotMatrixSmall}>
                      <DotMatrix pattern="privacy" size="small" />
                    </View>
                    
                    <View style={styles.analysisSeparator} />
                    
                    <View style={styles.analysisRow}>
                      <Text style={styles.analysisLabel}>Estimated Time:</Text>
                      <Text style={styles.analysisValue}>12 seconds</Text>
                    </View>
                    
                    <View style={styles.analysisRow}>
                      <Text style={styles.analysisLabel}>Relayer Fee:</Text>
                      <Text style={styles.analysisValue}>0.001 ETH</Text>
                    </View>
                  </CardContent>
                </Card>

                {/* Compliance Check - Always show for demo */}
                <Card style={styles.complianceCard}>
                  <CardContent>
                    <View style={styles.complianceHeader}>
                      <ShieldIcon size={16} color={colors.text.primary} />
                      <Text style={styles.complianceTitle}>Compliance Check:</Text>
                    </View>
                    
                    <View style={styles.complianceItem}>
                      <Text style={styles.checkmark}>✓</Text>
                      <Text style={styles.complianceText}>Recipient KYC Verified</Text>
                    </View>
                    
                    <View style={styles.complianceItem}>
                      <Text style={styles.checkmark}>✓</Text>
                      <Text style={styles.complianceText}>AML Screening Clear</Text>
                    </View>
                    
                    <View style={styles.complianceItem}>
                      <Text style={styles.checkmark}>✓</Text>
                      <Text style={styles.complianceText}>FEMA Compliance Met</Text>
                    </View>
                    
                    <View style={styles.complianceItem}>
                      <Text style={styles.checkmark}>✓</Text>
                      <Text style={styles.complianceText}>Auto-reporting to FIU</Text>
                    </View>
                    
                    <View style={styles.analysisSeparator} />
                    
                    <View style={styles.analysisRow}>
                      <Text style={styles.analysisLabel}>Regulatory Status:</Text>
                      <Text style={styles.analysisValueGreen}>Approved</Text>
                    </View>
                  </CardContent>
                </Card>


                {/* Warning */}
                <View style={styles.warningCard}>
                  <AlertTriangleIcon size={16} color={colors.text.secondary} />
                  <Text style={styles.warningText}>This action cannot be undone</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.confirmButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelButtonText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.withdrawButton} onPress={handleConfirmWithdrawal}>
                    <Text style={styles.withdrawButtonText}>WITHDRAW</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {step === 'zkproof' && (
            <View style={styles.content}>
              <View style={styles.centerSection}>
                <Text style={styles.title}>Generating Zero-Knowledge Proof</Text>
                <View style={styles.dotMatrixCenter}>
                  <DotMatrix pattern="privacy" size="small" />
                </View>
                
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>Progress: {Math.round(progress)}% Complete</Text>
                </View>

                <Card style={styles.merkleCard}>
                  <CardContent style={styles.merkleCardContent}>
                    <View style={styles.merkleTree}>
                      <View style={styles.merkleLevel}>
                        <View style={styles.merkleNodeLarge} />
                      </View>
                      <View style={styles.merkleLevel}>
                        <View style={styles.merkleNodeMedium} />
                        <View style={styles.merkleNodeMedium} />
                      </View>
                      <View style={styles.merkleLevel}>
                        <View style={styles.merkleNodeMedium} />
                        <View style={styles.merkleNodeMedium} />
                        <View style={styles.merkleNodeMedium} />
                        <View style={styles.merkleNodeMedium} />
                      </View>
                      <View style={styles.merkleLevel}>
                        <View style={styles.merkleNodeSmall} />
                        <View style={styles.merkleNodeSmall} />
                        <View style={styles.merkleNodeSmall} />
                        <Animated.View 
                          style={[
                            styles.merkleNodeSmall, 
                            styles.merkleNodeAccent,
                            {
                              opacity: nodeAnimation,
                              transform: [{ scale: nodeScale }]
                            }
                          ]} 
                        />
                        <View style={styles.merkleNodeSmall} />
                        <View style={styles.merkleNodeSmall} />
                        <View style={styles.merkleNodeSmall} />
                        <View style={styles.merkleNodeSmall} />
                      </View>
                    </View>
                    <Text style={styles.merkleText}>Your note position hidden</Text>
                  </CardContent>
                </Card>

                <View style={styles.stepsList}>
                  <Text style={styles.stepsTitle}>Current Step:</Text>
                  {getCurrentZKStep().completed.map((step, i) => (
                    <View key={i} style={styles.stepCompleted}>
                      <View style={styles.stepDotCompleted} />
                      <Text style={styles.stepTextCompleted}>✓ {step}</Text>
                    </View>
                  ))}
                  {getCurrentZKStep().current && (
                    <View style={styles.stepCurrent}>
                      <View style={styles.stepDotActive} />
                      <Text style={styles.stepTextActive}>● {getCurrentZKStep().current}</Text>
                    </View>
                  )}
                  {getCurrentZKStep().pending.slice(1).map((step, i) => (
                    <View key={i} style={styles.stepPending}>
                      <View style={styles.stepDotPending} />
                      <Text style={styles.stepTextPending}>○ {step}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.zkInfo}>
                  <Text style={styles.zkTime}>
                    Time remaining: ~{Math.max(1, Math.floor((100 - progress) / 12))} seconds
                  </Text>
                  <Text style={styles.zkStatus}>
                    Privacy Status: Generating unlinkable proof for {selectedNote ? noteStorageService.formatNoteForDisplay(selectedNote).privacySet.split(',')[0] : '47,293'} user anonymity set...
                  </Text>
                </View>
              </View>
            </View>
          )}

          {step === 'relayer' && (
            <View style={styles.content}>
              <View style={styles.centerSection}>
                <Text style={styles.title}>Submitting via Relayer...</Text>
                <View style={styles.dotMatrixCenter}>
                  <DotMatrix pattern="privacy" size="small" />
                </View>
                
                <Text style={styles.proofGenerated}>Proof Generated Successfully</Text>

                <Card style={styles.relayerCard}>
                  <CardContent style={styles.relayerCardContent}>
                    <View style={styles.privacyFlow}>
                      <View style={styles.flowStep}>
                        <Text style={styles.flowStepText}>[Your Device]</Text>
                        <View style={styles.dotMatrixSmall}>
                          <DotMatrix pattern="header" size="small" />
                        </View>
                      </View>
                      <View style={styles.flowStep}>
                        <View style={styles.dotMatrixSmall}>
                          <DotMatrix pattern="header" size="small" />
                        </View>
                        <Text style={styles.flowStepText}>[Relayer]</Text>
                        <View style={styles.dotMatrixSmall}>
                          <DotMatrix pattern="header" size="small" />
                        </View>
                      </View>
                      <View style={styles.flowStep}>
                        <View style={styles.dotMatrixSmall}>
                          <DotMatrix pattern="header" size="small" />
                        </View>
                        <Text style={styles.flowStepText}>[zkETHer]</Text>
                        <View style={styles.dotMatrixSmall}>
                          <DotMatrix pattern="header" size="small" />
                        </View>
                      </View>
                    </View>
                  </CardContent>
                </Card>
                
                <View style={styles.relayerInfo}>
                  <Text style={styles.relayerDetail}>Relayer: zkether-relay-03</Text>
                  <Text style={styles.relayerStatus}>Status: Validating proof...</Text>
                  <Text style={styles.relayerFee}>Fee: 0.001 ETH</Text>
                  
                  <View style={styles.privacyProtection}>
                    <View style={styles.protectionItem}>
                      <Text style={styles.protectionText}>Your identity: Protected</Text>
                      <View style={styles.dotMatrixSmall}>
                        <DotMatrix pattern="header" size="small" />
                      </View>
                    </View>
                    <View style={styles.protectionItem}>
                      <Text style={styles.protectionText}>Transaction link: Broken</Text>
                      <View style={styles.dotMatrixSmall}>
                        <DotMatrix pattern="header" size="small" />
                      </View>
                    </View>
                  </View>
                  
                  <Text style={styles.estimatedTime}>Estimated confirmation: 30s</Text>
                </View>
              </View>
            </View>
          )}

          {step === 'blockchain' && (
            <View style={styles.content}>
              <View style={styles.centerSection}>
                <Text style={styles.title}>Transaction Broadcasting...</Text>
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
                    <Text style={styles.statusText}>Block: #{blockNumber}</Text>
                    <Text style={styles.statusText}>Confirmations: 1/3</Text>
                  </View>
                </View>
                
                <TouchableOpacity style={styles.etherscanButton}>
                  <Text style={styles.etherscanText}>VIEW ON ETHERSCAN</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'complete' && (
            <View style={styles.content}>
              <View style={styles.centerSection}>
                <View style={styles.successIcon}>
                  <Text style={styles.successCheckmark}>✓</Text>
                </View>

                <Text style={styles.titleSuccess}>Withdrawal Successful</Text>
                <View style={styles.dotMatrixCenter}>
                  <DotMatrix pattern="privacy" size="small" />
                </View>

                <Card style={styles.completeCard}>
                  <CardContent style={styles.completeCardContent}>
                    <Text style={styles.completeStatus}>COMPLETE</Text>
                    <View style={styles.completeDetails}>
                      <Text style={styles.completeAmount}>{selectedNote?.amount} ETH Withdrawn</Text>
                      <Text style={styles.completeRecipient}>To: {withdrawalAddress?.slice(0, 12)}...</Text>
                    </View>
                    
                    <View style={styles.privacyStatus}>
                      <Text style={styles.privacyTitle}>Privacy Achieved:</Text>
                      <Text style={styles.privacyDetail}>Unlinkable from {selectedNote ? noteStorageService.formatNoteForDisplay(selectedNote).privacySet.split(',')[0] : '47,293'} possible deposits</Text>
                      <View style={styles.dotMatrixSmall}>
                        <DotMatrix pattern="privacy" size="small" />
                      </View>
                    </View>
                  </CardContent>
                </Card>
                
                <View style={styles.balanceUpdate}>
                  <Text style={styles.balanceTitle}>Updated Balance:</Text>
                  <Text style={styles.balanceAmount}>1.00 ETH UNLINKABLE</Text>
                  <Text style={styles.balanceNote}>(1 note remaining)</Text>
                </View>
                
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDetailText}>Transaction: {transactionHash}...</Text>
                  <Text style={styles.transactionDetailText}>Block: #{blockNumber}</Text>
                  <Text style={styles.transactionDetailText}>Gas Used: 487,234</Text>
                </View>
                
                <View style={styles.completeButtons}>
                  <TouchableOpacity style={styles.viewTransactionButton}>
                    <Text style={styles.viewTransactionText}>VIEW TRANSACTION</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.withdrawAnotherButton}>
                    <Text style={styles.withdrawAnotherText}>WITHDRAW ANOTHER</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: colors.text.primary,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  placeholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 18,
    color: colors.text.primary,
  },
  centerSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  availableNotes: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  dotMatrixCenter: {
    marginVertical: 8,
  },
  dotMatrixSmall: {
    marginTop: 8,
    alignItems: 'center',
  },
  notesContainer: {
    width: '100%',
    marginVertical: 20,
  },
  noteCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  noteContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    marginTop: 2,
  },
  radioButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  noteDetails: {
    flex: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  recommendedBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedText: {
    fontSize: 10,
    color: colors.background,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  noteAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  noteReceived: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  notePrivacySet: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  addressSection: {
    width: '100%',
    marginVertical: 20,
  },
  addressLabel: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  addressInput: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    padding: 12,
    fontSize: 12,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: 'monospace',
  },
  continueButton: {
    width: '100%',
    marginTop: 20,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  withdrawTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  withdrawAmount: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  withdrawTo: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  analysisCard: {
    width: '100%',
    marginVertical: 8,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  analysisLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  analysisValue: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  analysisValueGreen: {
    fontSize: 12,
    color: colors.accent,
    fontFamily: 'monospace',
  },
  analysisSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  complianceCard: {
    width: '100%',
    marginVertical: 8,
  },
  complianceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  complianceIcon: {
    marginRight: 8,
  },
  complianceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 8,
    fontFamily: 'monospace',
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkmark: {
    fontSize: 12,
    color: colors.accent,
    marginRight: 8,
    fontFamily: 'monospace',
  },
  complianceText: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSecondary,
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    width: '100%',
  },
  warningIcon: {
    marginRight: 8,
  },
  warningText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 8,
    fontFamily: 'monospace',
  },
  confirmButtons: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 12,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.cardSecondary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  withdrawButton: {
    flex: 1,
    backgroundColor: colors.text.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  withdrawButtonText: {
    fontSize: 14,
    color: colors.background,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  progressText: {
    fontSize: 14,
    color: colors.accent,
    fontFamily: 'monospace',
  },
  merkleCard: {
    width: '100%',
    marginVertical: 20,
    backgroundColor: colors.card,
  },
  merkleCardContent: {
    alignItems: 'center',
    padding: 20,
  },
  merkleText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 12,
    fontFamily: 'monospace',
  },
  stepsList: {
    width: '100%',
    marginVertical: 20,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  stepCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCurrent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepPending: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepDotCompleted: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginRight: 12,
  },
  stepDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginRight: 12,
  },
  stepDotPending: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginRight: 12,
  },
  stepTextCompleted: {
    fontSize: 12,
    color: colors.accent,
    fontFamily: 'monospace',
  },
  stepTextActive: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  stepTextPending: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  zkInfo: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  zkTime: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  zkStatus: {
    fontSize: 10,
    color: colors.text.secondary,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  networkStatus: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  networkCard: {
    width: '100%',
    marginVertical: 20,
    backgroundColor: colors.card,
  },
  networkCardContent: {
    alignItems: 'center',
    padding: 20,
  },
  transactionInfo: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
  },
  transactionLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  transactionHash: {
    fontSize: 10,
    color: colors.text.primary,
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  transactionStatus: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  etherscanButton: {
    backgroundColor: colors.cardSecondary,
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  etherscanText: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successCheckmark: {
    fontSize: 24,
    color: colors.background,
    fontWeight: 'bold',
  },
  titleSuccess: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  completeCard: {
    width: '100%',
    marginVertical: 20,
  },
  completeCardContent: {
    alignItems: 'center',
  },
  completeStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  completeDetails: {
    alignItems: 'center',
    marginBottom: 20,
  },
  completeAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  completeRecipient: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  privacyStatus: {
    alignItems: 'center',
    width: '100%',
  },
  privacyTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  privacyDetail: {
    fontSize: 10,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  balanceUpdate: {
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  balanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  balanceNote: {
    fontSize: 10,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  transactionDetails: {
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  transactionDetailText: {
    fontSize: 10,
    color: colors.text.secondary,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  completeButtons: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  viewTransactionButton: {
    backgroundColor: colors.cardSecondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  viewTransactionText: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  withdrawAnotherButton: {
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  withdrawAnotherText: {
    fontSize: 12,
    color: colors.background,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  finalBackButton: {
    backgroundColor: colors.cardSecondary,
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  finalBackText: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  proofGenerated: {
    fontSize: 12,
    color: colors.accent,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  loadingText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  noNotesText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  relayerCard: {
    width: '100%',
    marginVertical: 20,
    backgroundColor: colors.card,
  },
  relayerCardContent: {
    alignItems: 'center',
    padding: 20,
  },
  privacyFlow: {
    alignItems: 'center',
    width: '100%',
  },
  flowStep: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  flowStepText: {
    fontSize: 10,
    color: colors.text.secondary,
    marginHorizontal: 8,
    fontFamily: 'monospace',
  },
  relayerInfo: {
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  relayerDetail: {
    fontSize: 12,
    color: colors.text.primary,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  relayerStatus: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  relayerFee: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  privacyProtection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  protectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  protectionText: {
    fontSize: 12,
    color: colors.accent,
    marginHorizontal: 8,
    fontFamily: 'monospace',
  },
  estimatedTime: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 16,
    fontFamily: 'monospace',
  },
  merkleTree: {
    alignItems: 'center',
    marginBottom: 16,
  },
  merkleLevel: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  merkleNodeLarge: {
    width: 12,
    height: 12,
    backgroundColor: colors.text.primary,
    borderRadius: 6,
    margin: 2,
  },
  merkleNodeMedium: {
    width: 8,
    height: 8,
    backgroundColor: colors.text.primary,
    borderRadius: 4,
    margin: 2,
  },
  merkleNodeSmall: {
    width: 4,
    height: 4,
    backgroundColor: colors.text.primary,
    borderRadius: 2,
    margin: 1,
  },
  merkleNodeAccent: {
    backgroundColor: colors.accent,
  },
});
