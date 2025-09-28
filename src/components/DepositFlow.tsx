import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, TextInput, Animated, Alert, StyleSheet, Platform } from 'react-native';
import { Card, CardContent } from './ui/Card';
import Button from './ui/Button';
import DotMatrix from './ui/DotMatrix';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useWallet } from '../contexts/WalletContext';
import { useGasPrice, useEstimateGas, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther, parseUnits } from 'viem';
import { colors } from '../styles/colors';
import { createCommitmentForRecipient, isValidX25519PublicKey, createDemoCommitment } from '../services/commitmentService';
import * as FileSystem from 'expo-file-system';

// Mock Noir functions for demonstration
const generateNoirProof = async (circuitPath: string, srsPath: string | null, inputs: string[], onChain: boolean, vk: Uint8Array, lowMemoryMode: boolean): Promise<Uint8Array> => {
  // Simulate proof generation delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  // Return mock proof data
  return new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
};

const getNoirVerificationKey = async (circuitPath: string, srsPath: string | null, onChain: boolean, lowMemoryMode: boolean): Promise<Uint8Array> => {
  // Simulate VK generation delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Return mock verification key
  return new Uint8Array([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
};

const verifyNoirProof = async (circuitPath: string, proof: Uint8Array, onChain: boolean, vk: Uint8Array, lowMemoryMode: boolean): Promise<boolean> => {
  // Simulate verification delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  // Return mock verification result (always true for demo)
  return true;
};

interface DepositFlowProps {
  onClose: () => void;
}

type DepositStep = 'form' | 'confirmation' | 'approval' | 'commitment' | 'wallet-approval' | 'blockchain' | 'confirmed' | 'share-note' | 'complete';

// zkETHer contract address on Sepolia
const ZKETHER_CONTRACT_ADDRESS = '0x54DB9ebE77f961205E9BF5034C97d59a95C865C4' as const;

// ERC20 approve function ABI
const ZKETHER_ABI =[{"type":"constructor","inputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"deposit","inputs":[{"name":"token","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"emergencyWithdraw","inputs":[{"name":"token","type":"address","internalType":"address"},{"name":"to","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"getBalance","inputs":[{"name":"token","type":"address","internalType":"address"},{"name":"user","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getTotalDeposited","inputs":[{"name":"token","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"renounceOwnership","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"totalDeposited","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"userBalances","inputs":[{"name":"","type":"address","internalType":"address"},{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"withdraw","inputs":[{"name":"token","type":"address","internalType":"address"},{"name":"to","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"Deposit","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"token","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"name":"previousOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"Withdrawal","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"token","type":"address","indexed":true,"internalType":"address"},{"name":"to","type":"address","indexed":true,"internalType":"address"},{"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"error","name":"OwnableInvalidOwner","inputs":[{"name":"owner","type":"address","internalType":"address"}]},{"type":"error","name":"OwnableUnauthorizedAccount","inputs":[{"name":"account","type":"address","internalType":"address"}]},{"type":"error","name":"ReentrancyGuardReentrantCall","inputs":[]},{"type":"error","name":"SafeERC20FailedOperation","inputs":[{"name":"token","type":"address","internalType":"address"}]}]as const;

// zkETHer deposit function ABI
const ERC20_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_symbol",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "_decimals",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "_totalSupply",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "subtractedValue",
        "type": "uint256"
      }
    ],
    "name": "decreaseAllowance",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "addedValue",
        "type": "uint256"
      }
    ],
    "name": "increaseAllowance",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]as const;

// NoirProofComponent for generating and verifying zero-knowledge proofs
function NoirProofComponent({ onProofGenerated }: { onProofGenerated?: (proof: Uint8Array, isValid: string) => void }) {
    const [a, setA] = useState("3");
    const [b, setB] = useState("4");
    const [inputs, setInputs] = useState<string[]>([]);
    const [proof, setProof] = useState<Uint8Array>(new Uint8Array());
    const [isValid, setIsValid] = useState<string>("");
    const [vk, setVk] = useState<Uint8Array>(new Uint8Array());
    const [isGeneratingProof, setIsGeneratingProof] = useState(false);
    const [isVerifyingProof, setIsVerifyingProof] = useState(false);

    async function genProof(): Promise<void> {
        setIsGeneratingProof(true);
        const circuitInputs = {
            public_commitment : "21044526501566040117993124035879025401502295415862399375555023304404664663033",
            private_nullifier : "10521653044715741213389587207869002198029238622411268305570738397091138096268",
            private_secret : "15325408734600337950919883019972309724979760076380211312928044044232344243185"
        };
        
        try {
            if (Platform.OS === "web") {
                console.log("not implemented");
                setIsValid("Web platform not supported");
            } else if (Platform.OS === "android" || Platform.OS === "ios") {
                const circuitName = "noir_multiplier2.json";
                const srs_name = "noir_multiplier2.srs";
                
                const content = require(`@/assets/keys/${circuitName}`);
                const newFilePath = `${FileSystem.documentDirectory}${circuitName}`;
                const srsFilePath =  `${FileSystem.documentDirectory}${srs_name}`;
                const fileInfo = await FileSystem.getInfoAsync(newFilePath);

                if (!fileInfo.exists) {
                    try {
                        await FileSystem.writeAsStringAsync(
                            newFilePath,
                            JSON.stringify(content)
                        );
                    } catch (error) {
                        console.error("Error copying file:", error);
                        throw error;
                    }
                }

                try {
                    const onChain = false;  // Use Keccak for Solidity compatibility
                    const lowMemoryMode = true;
                    
                    console.log("Circuit inputs object:", circuitInputs);
                    
                    const inputArray = [
                        circuitInputs.public_commitment,
                        circuitInputs.private_nullifier,
                        circuitInputs.private_secret,
                    ];
                    console.log("Input array length:", inputArray.length);
                    console.log("Input array:", inputArray);
                    
                    // Generate or get existing verification key
                    let verificationKey: Uint8Array;
                    if (vk.length === 0) {
                        console.log("Generating verification key...");
                        try {
                            verificationKey = await getNoirVerificationKey(
                                newFilePath.replace("file://", ""),
                                null,
                                onChain,
                                lowMemoryMode
                            );
                            console.log("Verification key generated successfully, length:", verificationKey.length);
                            setVk(verificationKey);
                        } catch (vkError) {
                            console.error("Error generating verification key:", vkError);
                            throw vkError;
                        }
                    } else {
                        verificationKey = vk;
                        console.log("Using existing verification key, length:", verificationKey.length);
                    }

                    const res: Uint8Array = await generateNoirProof(
                        newFilePath.replace("file://", ""),
                        null,
                        inputArray,
                        onChain,
                        verificationKey,
                        lowMemoryMode
                    );
                    console.log("Proof generated successfully, length:", res.length);
                    setProof(res);
                    setIsValid("Proof generated successfully ✓");
                    
                    // Call callback if provided
                    if (onProofGenerated) {
                        onProofGenerated(res, "Proof generated successfully ✓");
                    }
                } catch (error) {
                    console.error("Detailed error generating proof:", error);
                    setIsValid("Error generating proof");
                    if (error instanceof Error) {
                        console.error("Error message:", error.message);
                        if (error.stack) {
                            console.error("Error stack:", error.stack);
                        }
                    }
                }
            }
        } finally {
            setIsGeneratingProof(false);
        }
    }

    async function verifyProof(): Promise<void> {
        setIsVerifyingProof(true);
        try {
            if (Platform.OS === "web") {
                setIsValid("not implemented");
            } else if (Platform.OS === "android" || Platform.OS === "ios") {
                if (proof.length === 0) {
                    setIsValid("Error: Proof data is not available. Generate proof first.");
                    return;
                }
                
                if (vk.length === 0) {
                    setIsValid("Error: Verification key is not available. Generate proof first.");
                    return;
                }

                const circuitName = "noir_multiplier2.json";
                const content = require(`@/assets/keys/${circuitName}`);
                const newFilePath = `${FileSystem.documentDirectory}${circuitName}`;

                const fileInfo = await FileSystem.getInfoAsync(newFilePath);
                if (!fileInfo.exists) {
                    try {
                        await FileSystem.writeAsStringAsync(
                            newFilePath,
                            JSON.stringify(content)
                        );
                    } catch (error) {
                        console.error("Error copying file:", error);
                        throw error;
                    }
                }

                try {
                    const onChain = true;  // Use Keccak for Solidity compatibility
                    const lowMemoryMode = false;

                    const res: boolean = await verifyNoirProof(
                        newFilePath.replace("file://", ""),
                        proof,
                        onChain,
                        vk,
                        lowMemoryMode
                    );
                    setIsValid(res.toString());
                } catch (error) {
                    console.error("Error verifying proof:", error);
                    setIsValid("Error verifying proof");
                }
            }
        } finally {
            setIsVerifyingProof(false);
        }
    }

    return (
        <View style={styles.proofContainer}>
            <View style={styles.inputContainer}>
                <Text style={styles.label}>a</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter value for a"
                    value={a}
                    onChangeText={setA}
                    keyboardType="numeric"
                />
            </View>
            <View style={styles.inputContainer}>
                <Text style={styles.label}>b</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter value for b"
                    value={b}
                    onChangeText={setB}
                    keyboardType="numeric"
                />
            </View>
            <Button 
                title={isGeneratingProof ? "Generating..." : "Generate Noir Proof"} 
                onPress={() => genProof()} 
                disabled={isGeneratingProof}
            />
            <Button 
                title={isVerifyingProof ? "Verifying..." : "Verify Noir Proof"} 
                onPress={() => verifyProof()} 
                disabled={isVerifyingProof || proof.length === 0}
            />
            <View style={styles.stepContainer}>
                <Text style={styles.subtitle}>Proof is Valid:</Text>
                <Text style={styles.output}>{isValid}</Text>
                <Text style={styles.subtitle}>Proof:</Text>
                <ScrollView style={styles.outputScroll}>
                    <Text style={styles.output}>{proof.length > 0 ? Array.from(proof).join(',') : 'No proof generated'}</Text>
                </ScrollView>
            </View>
        </View>
    );
}

export default function DepositFlow({ onClose }: DepositFlowProps) {
  const [step, setStep] = useState<DepositStep>('form');
  const [recipient, setRecipient] = useState('');
  const [progress, setProgress] = useState(0);
  const [nonce, setNonce] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [leafIndex, setLeafIndex] = useState(0);
  const [blockNumber, setBlockNumber] = useState(0);
  const [commitmentData, setCommitmentData] = useState<any>(null);
  const [isValidRecipient, setIsValidRecipient] = useState(true); // Always valid for hardcoded flow
  const [isDepositing, setIsDepositing] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [currentTxType, setCurrentTxType] = useState<'approval' | 'deposit' | null>(null);
  const [transactionTimeout, setTransactionTimeout] = useState<NodeJS.Timeout | null>(null);
  const { isKYCCompleted } = useOnboarding();
  const { isConnected, address, balance, walletType, isCorrectChain, chainId, switchToSepolia } = useWallet();

  // Wagmi contract interaction hooks for approval
  const { writeContract: writeApproval, data: approvalHash, error: approvalError, isPending: isApprovalPending, reset: resetApproval } = useWriteContract();
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // Wagmi contract interaction hooks for deposit
  const { writeContract: writeDeposit, data: depositHash, error: depositError, isPending: isDepositPending, reset: resetDeposit } = useWriteContract();
  const { isLoading: isDepositConfirming, isSuccess: isDepositConfirmed } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  // Real-time gas estimation
  const { data: gasPrice } = useGasPrice();
  const { data: gasEstimate } = useEstimateGas({
    to: ZKETHER_CONTRACT_ADDRESS,
    value: parseEther('1'),
    account: address as `0x${string}` | undefined,
    data: commitmentData ? `0x${commitmentData.commitment.replace('0x', '')}` : undefined,
  });
  
  // Calculations
  const depositAmount = 1.0;
  const gasFeeInWei = gasPrice && gasEstimate ? gasPrice * gasEstimate : 0n;
  const gasFee = gasFeeInWei ? parseFloat(formatEther(gasFeeInWei)) : 0.003; // fallback
  const totalCost = depositAmount + gasFee;

  // Hardcoded commitment generation - always create demo commitment
  useEffect(() => {
    const createHardcodedCommitment = async () => {
      if (recipient.trim()) {
        try {
          // Always create demo commitment regardless of input
          const demoCommitment = await createDemoCommitment(recipient || 'hardcoded-recipient');
          setCommitmentData(demoCommitment);
          setIsValidRecipient(true);
        } catch (error) {
          console.error('Error creating hardcoded commitment:', error);
          // Fallback to basic hardcoded commitment
          setCommitmentData({
            commitment: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            R_pub_hex: '0xabcdef1234567890',
            nullifier: '0xfedcba0987654321'
          });
          setIsValidRecipient(true);
        }
      } else {
        setIsValidRecipient(false);
        setCommitmentData(null);
      }
    };

    createHardcodedCommitment();
  }, [recipient]);

  // Generate mock data
  useEffect(() => {
    if (step === 'commitment') {
      if (commitmentData) {
        setNonce(commitmentData.R_pub_hex.substring(0, 13));
      } else {
        setNonce(Math.random().toString(36).substring(2, 15));
      }
      setTransactionHash('0x' + Math.random().toString(16).substring(2, 66));
      setLeafIndex(Math.floor(Math.random() * 1000) + 100);
      setBlockNumber(Math.floor(Math.random() * 1000000) + 18000000);
    }
  }, [step, commitmentData]);

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

  // Handle approval transaction states
  useEffect(() => {
    if (approvalHash && step === 'wallet-approval' && currentTxType === 'approval') {
      console.log('✅ Approval hash received:', approvalHash);
      setTransactionHash(approvalHash);
      setStep('blockchain');
      
      // Clear timeout since transaction was successful
      if (transactionTimeout) {
        clearTimeout(transactionTimeout);
        setTransactionTimeout(null);
      }
    }
  }, [approvalHash, step, currentTxType, transactionTimeout]);

  // Debug logging for transaction states
  useEffect(() => {
    console.log('🔍 Transaction State Debug:', {
      step,
      currentTxType,
      isApprovalPending,
      isDepositPending,
      approvalHash,
      depositHash,
      isApprovalConfirmed,
      isDepositConfirmed
    });
  }, [step, currentTxType, isApprovalPending, isDepositPending, approvalHash, depositHash, isApprovalConfirmed, isDepositConfirmed]);

  useEffect(() => {
    if (isApprovalConfirmed && step === 'blockchain' && currentTxType === 'approval') {
      console.log('✅ Approval confirmed, now initiating deposit...');
      // Start deposit transaction
      setCurrentTxType('deposit');
      setStep('wallet-approval');
      
      // Reset deposit state before new transaction
      resetDeposit();
      
      setTimeout(() => {
        console.log('🚀 Initiating deposit transaction...');
        try {
          // Set a timeout for the deposit transaction
          const timeout = setTimeout(() => {
            console.log('⏰ Deposit transaction timeout - no response from wallet');
            setTransactionError('Deposit transaction timeout - please try again');
            setIsDepositing(false);
            setCurrentTxType(null);
            setStep('approval');
            Alert.alert('Transaction Timeout', 'The wallet did not respond to the deposit transaction. Please try again.');
          }, 30000); // 30 second timeout
          
          setTransactionTimeout(timeout);
          
          writeDeposit({
            address: ZKETHER_CONTRACT_ADDRESS,
            abi: ZKETHER_ABI,
            functionName: 'deposit',
            args: ["0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", parseUnits('1', 6)]
          });
        } catch (error) {
          console.error('❌ Failed to initiate deposit:', error);
          setTransactionError('Failed to initiate deposit transaction');
          setIsDepositing(false);
          setCurrentTxType(null);
          setStep('approval');
        }
      }, 1000); // Increased delay to ensure wallet is ready
    }
  }, [isApprovalConfirmed, step, currentTxType, writeDeposit, resetDeposit]);

  // Handle deposit transaction states
  useEffect(() => {
    if (depositHash && step === 'wallet-approval' && currentTxType === 'deposit') {
      console.log('✅ Deposit hash received:', depositHash);
      setTransactionHash(depositHash);
      setStep('blockchain');
      
      // Clear timeout since transaction was successful
      if (transactionTimeout) {
        clearTimeout(transactionTimeout);
        setTransactionTimeout(null);
      }
    }
  }, [depositHash, step, currentTxType, transactionTimeout]);

  useEffect(() => {
    if (isDepositConfirmed && step === 'blockchain' && currentTxType === 'deposit') {
      console.log('✅ Deposit confirmed');
      setStep('confirmed');
      setIsDepositing(false);
      setCurrentTxType(null);
    }
  }, [isDepositConfirmed, step, currentTxType]);

  // Handle transaction errors
  useEffect(() => {
    if (approvalError) {
      console.log('❌ Approval error:', approvalError.message);
      setTransactionError(approvalError.message);
      setIsDepositing(false);
      setCurrentTxType(null);
      setStep('approval');
      
      // Check if it's a user rejection
      if (approvalError.message.includes('User rejected') || approvalError.message.includes('user rejected')) {
        Alert.alert('Transaction Cancelled', 'You cancelled the approval transaction.');
      } else {
        Alert.alert('Approval Failed', approvalError.message);
      }
    }
  }, [approvalError]);

  useEffect(() => {
    if (depositError) {
      console.log('❌ Deposit error:', depositError.message);
      setTransactionError(depositError.message);
      setIsDepositing(false);
      setCurrentTxType(null);
      setStep('approval');
      
      // Check if it's a user rejection
      if (depositError.message.includes('User rejected') || depositError.message.includes('user rejected')) {
        Alert.alert('Transaction Cancelled', 'You cancelled the deposit transaction.');
      } else {
        Alert.alert('Deposit Failed', depositError.message);
      }
    }
  }, [depositError]);

  // Progress animation for commitment generation (only when not using real contract)
  useEffect(() => {
    if (step === 'commitment' && !isDepositing) {
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
  }, [step, isDepositing]);

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
    if (!commitmentData) {
      Alert.alert('Error', 'Commitment generation failed. Please check the recipient key.');
      return;
    }
    setStep('confirmation');
  };

  const handleDeposit = () => {
    setStep('approval');
  };

  const handleApproveDeposit = async () => {
    if (!commitmentData || !isConnected) {
      Alert.alert('Error', 'Please ensure wallet is connected and commitment is generated');
      return;
    }

    if (!isCorrectChain) {
      // Auto-switch to Sepolia without prompting
      try {
        await switchToSepolia();
        // Wait a moment for chain switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        Alert.alert('Network Error', 'Please switch to Sepolia testnet in your wallet.');
        return;
      }
    }

    try {
      setIsDepositing(true);
      setTransactionError(null);
      setStep('commitment');
      setProgress(0);

      // Wait for commitment generation to complete
      await new Promise(resolve => {
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              resolve(undefined);
              return 100;
            }
            return prev + 2;
          });
        }, 100);
      });

      // Move to wallet approval step for token approval
      setStep('wallet-approval');
      setCurrentTxType('approval');

      // Reset any previous transaction state
      resetApproval();
      resetDeposit();
      
      // Small delay to ensure state is clean
      setTimeout(() => {
        console.log('🚀 Initiating ERC20 approval transaction...');
        try {
          // Set a timeout for the transaction
          const timeout = setTimeout(() => {
            console.log('⏰ Transaction timeout - no response from wallet');
            setTransactionError('Transaction timeout - please try again');
            setIsDepositing(false);
            setCurrentTxType(null);
            setStep('approval');
            Alert.alert('Transaction Timeout', 'The wallet did not respond. Please try again.');
          }, 30000); // 30 second timeout
          
          setTransactionTimeout(timeout);
          
          // First approve the token spend
          writeApproval({
            address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // USDC address
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [ZKETHER_CONTRACT_ADDRESS, parseUnits('1', 6)] // Approve 1 USDC
          });
        } catch (error) {
          console.error('❌ Failed to initiate approval:', error);
          setTransactionError('Failed to initiate approval transaction');
          setIsDepositing(false);
          setCurrentTxType(null);
          setStep('approval');
        }
      }, 1000); // Increased delay for wallet readiness

    } catch (error) {
      console.error('Transaction error:', error);
      setTransactionError(error instanceof Error ? error.message : 'Unknown error occurred');
      setIsDepositing(false);
      setCurrentTxType(null);
      Alert.alert('Transaction Failed', 'Failed to initiate transaction. Please try again.');
    }
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
                <Text style={styles.title}>Send USDC Privately</Text>
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
                      style={[
                        styles.input,
                        recipient.trim() ? styles.inputValid : null
                      ]}
                      placeholder="Bob's zkETHer Public Key (0x1a2b3c4d...)"
                      placeholderTextColor={colors.text.secondary}
                      value={recipient}
                      onChangeText={setRecipient}
                    />
                    <View style={styles.inputIcon}>
                      {recipient.trim() ? (
                        <Text style={styles.validIcon}>✓</Text>
                      ) : (
                        <DotMatrix pattern="header" size="small" />
                      )}
                    </View>
                  </View>
                  
                  {/* Commitment Status */}
                  {commitmentData && (
                    <View style={styles.commitmentStatus}>
                      <Text style={styles.commitmentStatusText}>
                        🔐 Commitment created for zkETHer deposit
                      </Text>
                      <Text style={styles.commitmentHash}>
                        Commitment: {commitmentData.commitment.substring(0, 16)}...
                      </Text>
                    </View>
                  )}
                </View>


                {/* Amount Section */}
                <View style={styles.section}>
                  <Text style={styles.label}>Amount: 1 USDC (Fixed)</Text>
                  <Card style={styles.amountCard}>
                    <CardContent>
                      <View style={styles.amountContent}>
                        <Text style={styles.amountText}>1 USDC</Text>
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
                          {isConnected && (
                            <Text style={[styles.walletNetworkStatus, isCorrectChain ? styles.networkCorrect : styles.networkWrong]}>
                              Network: {isCorrectChain ? 'Sepolia ✓' : `Chain ${chainId} ⚠️`}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.walletEmoji}>📱</Text>
                      </View>
                    </CardContent>
                  </Card>
                </View>

                {/* Network Warning - Simplified */}
                {isConnected && !isCorrectChain && (
                  <View style={styles.networkWarningSimple}>
                    <Text style={styles.networkWarningSimpleText}>Switching to Sepolia...</Text>
                  </View>
                )}

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

          {step === 'approval' && (
            <>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={() => setStep('confirmation')} style={styles.backButton}>
                  <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Approve Deposit</Text>
                <View style={styles.placeholder} />
              </View>
              
              <View style={styles.content}>
                {/* Dot Matrix */}
                <View style={styles.dotMatrixCenter}>
                  <DotMatrix pattern="privacy" size="medium" />
                </View>

                {/* Approval Request */}
                <View style={styles.centerSection}>
                  <Text style={styles.noteTitle}>Ready to Deposit</Text>
                  <Text style={styles.noteSubtitle}>Please review and approve this transaction</Text>
                </View>

                {/* Approval Details Card */}
                <Card style={styles.detailsCard}>
                  <CardContent>
                    <Text style={styles.detailsTitle}>Transaction Summary:</Text>
                    
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Contract:</Text>
                      <Text style={styles.detailsValue}>{ZKETHER_CONTRACT_ADDRESS.slice(0, 10)}...</Text>
                    </View>
                    
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Amount:</Text>
                      <Text style={styles.detailsValue}>1 USDC</Text>
                    </View>
                    
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Gas Fee:</Text>
                      <Text style={styles.detailsValue}>{gasFee.toFixed(6)} ETH</Text>
                    </View>
                    
                    <View style={[styles.detailsRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>USDC Amount:</Text>
                      <Text style={styles.totalValue}>1 USDC</Text>
                    </View>
                    
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>+ Gas Fee:</Text>
                      <Text style={styles.detailsValue}>{gasFee.toFixed(6)} ETH</Text>
                    </View>

                    <View style={styles.featureSection}>
                      <Text style={styles.featureTitle}>What will happen:</Text>
                      <Text style={styles.featureItem}>✓ Commitment will be generated</Text>
                      <Text style={styles.featureItem}>✓ MetaMask will open for approval</Text>
                      <Text style={styles.featureItem}>✓ Transaction sent to Sepolia network</Text>
                      <Text style={styles.featureItem}>✓ Funds deposited to zkETHer contract</Text>
                    </View>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <View style={styles.confirmButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setStep('confirmation')}>
                    <Text style={styles.cancelButtonText}>BACK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.depositButton} onPress={handleApproveDeposit}>
                    <Text style={styles.depositButtonText}>APPROVE & DEPOSIT</Text>
                  </TouchableOpacity>
                </View>
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
                  <Text style={styles.noteSubtitle}>To: zkETHer Contract ({ZKETHER_CONTRACT_ADDRESS.slice(0, 12)}...)</Text>
                  <Text style={styles.noteAmount}>Amount: 1 USDC</Text>
                </View>

                {/* Transaction Details Card */}
                <Card style={styles.detailsCard}>
                  <CardContent>
                    <Text style={styles.detailsTitle}>Transaction Details:</Text>
                    
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Amount:</Text>
                      <Text style={styles.detailsValue}>1 USDC</Text>
                    </View>
                    
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Gas Fee:</Text>
                      <Text style={styles.detailsValue}>{gasFee.toFixed(6)} ETH</Text>
                    </View>
                    
                    <View style={[styles.detailsRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>USDC Amount:</Text>
                      <Text style={styles.totalValue}>1 USDC</Text>
                    </View>
                    
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>+ Gas Fee:</Text>
                      <Text style={styles.detailsValue}>{gasFee.toFixed(6)} ETH</Text>
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
                    <Text style={styles.depositButtonText}>CONTINUE</Text>
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
                  <Text style={styles.commitmentLabel}>Creating note for zkETHer deposit...</Text>
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
                      <Text style={styles.walletDetailText}>To: {ZKETHER_CONTRACT_ADDRESS.slice(0, 10)}...</Text>
                      <Text style={styles.walletDetailText}>Amount: 1 USDC</Text>
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
                  <Text style={styles.waitingText}>
                    {(isApprovalPending || isDepositPending) ? 
                      `Waiting for ${currentTxType === 'approval' ? 'token approval' : 'deposit'} confirmation...` : 
                      'Preparing transaction...'
                    }
                  </Text>
                  <Text style={styles.waitingNote}>
                    {currentTxType === 'approval' ? 
                      'Step 1/2: Approving USDC spend permission' : 
                      currentTxType === 'deposit' ?
                      'Step 2/2: Depositing USDC to zkETHer contract' :
                      'Note: This transaction will be publicly visible on Ethereum'
                    }
                  </Text>
                  {transactionError && (
                    <Text style={styles.errorText}>Error: {transactionError}</Text>
                  )}
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
                
                <Text style={styles.networkStatus}>
                  Sepolia Network: {(isApprovalConfirming || isDepositConfirming) ? 'Confirming...' : 'Broadcasting...'}
                </Text>

                <Card style={styles.networkCard}>
                  <CardContent style={styles.networkCardContent}>
                    <DotMatrix pattern="network" />
                  </CardContent>
                </Card>
                
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionLabel}>Transaction Hash:</Text>
                  <Text style={styles.transactionHash}>{transactionHash}</Text>
                  
                  <View style={styles.transactionStatus}>
                    <Text style={styles.statusText}>
                      Status: {(isApprovalConfirming || isDepositConfirming) ? 'Confirming...' : 'Pending...'}
                    </Text>
                    <Text style={styles.statusText}>Block: Waiting for inclusion</Text>
                    <Text style={styles.statusText}>
                      Confirmations: {(isApprovalConfirmed || isDepositConfirmed) ? '3/3' : '0/3'}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.etherscanButton}
                  onPress={() => {
                    const currentHash = depositHash || approvalHash || transactionHash;
                    if (currentHash) {
                      // Open Sepolia Etherscan
                      Alert.alert('View Transaction', `Transaction Hash: ${currentHash}\n\nView on Sepolia Etherscan: https://sepolia.etherscan.io/tx/${currentHash}`);
                    }
                  }}
                >
                  <Text style={styles.etherscanText}>VIEW ON SEPOLIA ETHERSCAN</Text>
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
                    <Text style={styles.shareDetailText}>Amount: 1 USDC</Text>
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
                      <Text style={styles.completeAmount}>1 USDC Deposited</Text>
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
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 8,
    textAlign: 'center',
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
  
  // Input validation styles
  inputValid: {
    borderColor: '#22c55e',
    borderWidth: 2,
  },
  inputInvalid: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  validIcon: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: 'bold',
  },
  invalidIcon: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  
  // Commitment status styles
  commitmentStatus: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  commitmentStatusText: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  
  // Network status styles
  walletNetworkStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  networkCorrect: {
    color: '#22c55e',
  },
  networkWrong: {
    color: '#ef4444',
  },
  
  // Network warning styles
  networkWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkWarningContent: {
    flex: 1,
    marginLeft: 8,
  },
  networkWarningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 4,
  },
  networkWarningText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  switchButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  switchButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Simplified network warning styles
  networkWarningSimple: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 6,
    padding: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  networkWarningSimpleText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
});
