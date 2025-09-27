import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAppKit } from '@reown/appkit-wagmi-react-native';
import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { formatEther } from 'viem';

export type WalletType = 'appkit' | null;

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: string;
  walletType: WalletType;
  connectWallet: () => void;
  disconnectWallet: () => Promise<void>;
  getBalance: () => Promise<void>;
  openModal: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [formattedBalance, setFormattedBalance] = useState('0.0');
  
  const { data: balanceData } = useBalance({
    address: address as `0x${string}` | undefined,
  });

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

  const value: WalletContextType = {
    isConnected,
    address: address || null,
    balance: formattedBalance,
    walletType,
    connectWallet,
    disconnectWallet,
    getBalance,
    openModal,
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
