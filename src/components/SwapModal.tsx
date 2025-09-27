import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { swapService, SwapQuote } from '../services/swapService';
import { networkService } from '../services/networkService';

interface SwapModalProps {
  visible: boolean;
  onClose: () => void;
  onSwapComplete: () => void;
  userAddress: string;
}

type SwapDirection = 'ETH_TO_ZKETH' | 'ZKETH_TO_ETH';

export const SwapModal: React.FC<SwapModalProps> = ({
  visible,
  onClose,
  onSwapComplete,
  userAddress,
}) => {
  const [swapDirection, setSwapDirection] = useState<SwapDirection>('ETH_TO_ZKETH');
  const [inputAmount, setInputAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [ethBalance, setEthBalance] = useState('0.0');
  const [zkethBalance, setZkethBalance] = useState('0.0');
  const [isOnAnvil, setIsOnAnvil] = useState(false);

  useEffect(() => {
    if (visible) {
      loadBalances();
      checkNetwork();
    }
  }, [visible, userAddress]);

  useEffect(() => {
    if (inputAmount && parseFloat(inputAmount) > 0) {
      getQuote();
    } else {
      setQuote(null);
    }
  }, [inputAmount, swapDirection]);

  const loadBalances = async () => {
    if (!userAddress) return;
    
    try {
      const ethBalance = await networkService.getBalance(userAddress as `0x${string}`);
      const zkethBalance = await swapService.getZkETHBalance(userAddress as `0x${string}`);
      
      setEthBalance(ethBalance);
      setZkethBalance(zkethBalance);
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const checkNetwork = async () => {
    try {
      const onAnvil = await networkService.isOnAnvil();
      setIsOnAnvil(onAnvil);
    } catch (error) {
      console.error('Error checking network:', error);
    }
  };

  const getQuote = async () => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) return;

    setLoading(true);
    try {
      if (swapDirection === 'ETH_TO_ZKETH') {
        const swapQuote = await swapService.getSwapQuote(inputAmount);
        setQuote(swapQuote);
      } else {
        // For zkETH to ETH, we'll show a simplified quote
        const tdsAmount = (parseFloat(inputAmount) * 0.01).toString();
        const netAmount = (parseFloat(inputAmount) * 0.99).toString();
        setQuote({
          ethAmount: netAmount,
          zkethAmount: inputAmount,
          tdsAmount,
          netAmount,
          gasFee: '0.001',
        });
      }
    } catch (error) {
      console.error('Error getting quote:', error);
      Alert.alert('Error', 'Failed to get swap quote');
    } finally {
      setLoading(false);
    }
  };

  const handleNetworkSwitch = async () => {
    try {
      const success = await networkService.switchToAnvil();
      if (success) {
        setIsOnAnvil(true);
        loadBalances();
      } else {
        Alert.alert('Error', 'Failed to switch to Anvil network');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to switch network');
    }
  };

  const handleSwap = async () => {
    if (!quote || !inputAmount) return;

    // Validate balances
    if (swapDirection === 'ETH_TO_ZKETH') {
      const hasBalance = await swapService.checkETHBalance(userAddress as `0x${string}`, inputAmount);
      if (!hasBalance) {
        Alert.alert('Insufficient Balance', 'You don\'t have enough ETH for this swap');
        return;
      }
    } else {
      const hasBalance = await swapService.checkZkETHBalance(userAddress as `0x${string}`, inputAmount);
      if (!hasBalance) {
        Alert.alert('Insufficient Balance', 'You don\'t have enough zkETH for this swap');
        return;
      }
    }

    setSwapping(true);
    try {
      let result;
      if (swapDirection === 'ETH_TO_ZKETH') {
        result = await swapService.swapETHToZkETH(inputAmount);
      } else {
        result = await swapService.swapZkETHToETH(inputAmount);
      }

      if (result.success) {
        Alert.alert(
          'Swap Successful!',
          `Transaction hash: ${result.txHash?.slice(0, 10)}...`,
          [
            {
              text: 'OK',
              onPress: () => {
                onSwapComplete();
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Swap Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      Alert.alert('Error', 'Swap transaction failed');
    } finally {
      setSwapping(false);
    }
  };

  const toggleSwapDirection = () => {
    setSwapDirection(prev => 
      prev === 'ETH_TO_ZKETH' ? 'ZKETH_TO_ETH' : 'ETH_TO_ZKETH'
    );
    setInputAmount('');
    setQuote(null);
  };

  const maxBalance = swapDirection === 'ETH_TO_ZKETH' ? ethBalance : zkethBalance;
  const inputToken = swapDirection === 'ETH_TO_ZKETH' ? 'ETH' : 'zkETH';
  const outputToken = swapDirection === 'ETH_TO_ZKETH' ? 'zkETH' : 'ETH';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Swap Tokens</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {!isOnAnvil && (
            <View style={styles.networkWarning}>
              <Text style={styles.warningText}>⚠️ Switch to Anvil Network</Text>
              <TouchableOpacity onPress={handleNetworkSwitch} style={styles.switchButton}>
                <Text style={styles.switchButtonText}>Switch Network</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceText}>ETH: {parseFloat(ethBalance).toFixed(4)}</Text>
            <Text style={styles.balanceText}>zkETH: {parseFloat(zkethBalance).toFixed(4)}</Text>
          </View>

          <View style={styles.swapContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>From: {inputToken}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={inputAmount}
                  onChangeText={setInputAmount}
                  placeholder="0.0"
                  keyboardType="numeric"
                  placeholderTextColor="#666"
                />
                <TouchableOpacity
                  onPress={() => setInputAmount(maxBalance)}
                  style={styles.maxButton}
                >
                  <Text style={styles.maxText}>MAX</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.balanceLabel}>
                Balance: {parseFloat(maxBalance).toFixed(4)} {inputToken}
              </Text>
            </View>

            <TouchableOpacity onPress={toggleSwapDirection} style={styles.swapButton}>
              <Text style={styles.swapIcon}>⇅</Text>
            </TouchableOpacity>

            <View style={styles.outputContainer}>
              <Text style={styles.label}>To: {outputToken}</Text>
              <View style={styles.outputBox}>
                <Text style={styles.outputAmount}>
                  {loading ? '...' : quote?.netAmount || '0.0'}
                </Text>
              </View>
            </View>
          </View>

          {quote && (
            <View style={styles.quoteContainer}>
              <Text style={styles.quoteTitle}>Swap Details:</Text>
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>TDS (1%):</Text>
                <Text style={styles.quoteValue}>{quote.tdsAmount} {inputToken}</Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>Gas Fee:</Text>
                <Text style={styles.quoteValue}>{quote.gasFee} ETH</Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabelBold}>You'll receive:</Text>
                <Text style={styles.quoteValueBold}>{quote.netAmount} {outputToken}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!quote || !isOnAnvil || swapping) && styles.confirmButtonDisabled,
            ]}
            onPress={handleSwap}
            disabled={!quote || !isOnAnvil || swapping}
          >
            {swapping ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.confirmButtonText}>
                Swap {inputToken} for {outputToken}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: '#888',
  },
  networkWarning: {
    backgroundColor: '#2a1a1a',
    borderColor: '#ff4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  warningText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  switchButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  switchButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  balanceText: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  swapContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'monospace',
  },
  maxButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  maxText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  balanceLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  swapButton: {
    alignSelf: 'center',
    backgroundColor: '#333',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  swapIcon: {
    fontSize: 20,
    color: '#ffffff',
  },
  outputContainer: {
    marginTop: 16,
  },
  outputBox: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  outputAmount: {
    color: '#00ff88',
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  quoteContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  quoteTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quoteLabel: {
    color: '#888',
    fontSize: 12,
  },
  quoteLabelBold: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quoteValue: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  quoteValueBold: {
    color: '#00ff88',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#00ff88',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#333',
  },
  confirmButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
