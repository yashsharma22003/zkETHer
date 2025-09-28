import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAppKit } from '@reown/appkit-wagmi-react-native';
import { useAccount, useBalance, useDisconnect, useSwitchChain, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { sepolia } from '@wagmi/core/chains';
import { Alert } from 'react-native';

export type WalletType = 'appkit' | null;

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: string;
  walletType: WalletType;
  chainId: number | undefined;
  isCorrectChain: boolean;
  connectWallet: () => void;
  disconnectWallet: () => Promise<void>;
  getBalance: () => Promise<void>;
  openModal: () => void;
  switchToSepolia: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const chainId = useChainId();
  const [formattedBalance, setFormattedBalance] = useState('0.0');
  
  const { data: balanceData } = useBalance({
    address: address as `0x${string}` | undefined,
  });

  const isCorrectChain = chainId === sepolia.id;

  const walletType: WalletType = isConnected ? 'appkit' : null;

  // Update formatted balance when balance data changes
  useEffect(() => {
    if (balanceData) {
      const formatted = parseFloat(formatEther(balanceData.value)).toFixed(4);
      setFormattedBalance(formatted);
    } else {
      setFormattedBalance('0.0');
    }
  }, [balanceData]);

  const connectWallet = () => {
    open();
  };

  const openModal = () => {
    open();
  };

  const disconnectWallet = async () => {
    try {
      await disconnect();
      setFormattedBalance('0.0');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const getBalance = async () => {
    // Balance is automatically fetched by wagmi hook
    // This method is kept for compatibility
  };

  const switchToSepolia = async () => {
    try {
      if (!isConnected) {
        Alert.alert('Wallet Not Connected', 'Please connect your wallet first.');
        return;
      }
      
      if (chainId === sepolia.id) {
        return; // Already on Sepolia
      }

      await switchChain({ chainId: sepolia.id });
    } catch (error) {
      console.error('Error switching to Sepolia:', error);
      Alert.alert(
        'Chain Switch Failed',
        'Failed to switch to Sepolia testnet. Please switch manually in your wallet.'
      );
    }
  };

  // Auto-switch to Sepolia when wallet connects
  useEffect(() => {
    if (isConnected && chainId && chainId !== sepolia.id) {
      // Automatically switch to Sepolia without user prompt
      switchToSepolia();
    }
  }, [isConnected, chainId]);

  const value: WalletContextType = {
    isConnected,
    address: address || null,
    balance: formattedBalance,
    walletType,
    chainId,
    isCorrectChain,
    connectWallet,
    disconnectWallet,
    getBalance,
    openModal,
    switchToSepolia,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
