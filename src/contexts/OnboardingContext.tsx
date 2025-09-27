import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { OnboardingContextType, KYCData, OnboardingStep } from '../types/index';
import { zkETHerEventListener } from '../services/zkETHerEventListener';

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('circom');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletType, setWalletType] = useState('');
  const [isKYCCompleted, setIsKYCCompleted] = useState(false);
  const [kycData, setKYCDataState] = useState<KYCData | null>(null);

  // Load persisted data on app start
  useEffect(() => {
    loadPersistedData();
  }, []);

  // Start zkETHer event listener for onboarded users
  useEffect(() => {
    const startBackgroundListener = async () => {
      // Only start if user has completed onboarding (has keys and KYC)
      if (currentStep === 'complete' && isKYCCompleted) {
        try {
          console.log('🚀 Starting background zkETHer event listener for onboarded user');
          await zkETHerEventListener.startListening();
        } catch (error) {
          console.error('❌ Failed to start background event listener:', error);
          // Don't block app startup if event listener fails
        }
      }
    };

    startBackgroundListener();

    // Cleanup on unmount
    return () => {
      if (zkETHerEventListener.isListening) {
        zkETHerEventListener.stopListening();
        console.log('🛑 Stopped background zkETHer event listener');
      }
    };
  }, [currentStep, isKYCCompleted]);

  const loadPersistedData = async () => {
    try {
      const [
        savedStep,
        savedWalletAddress,
        savedWalletBalance,
        savedWalletType,
        savedKYCStatus,
        savedKYCData,
      ] = await Promise.all([
        SecureStore.getItemAsync('onboarding_step'),
        SecureStore.getItemAsync('wallet_address'),
        SecureStore.getItemAsync('wallet_balance'),
        SecureStore.getItemAsync('wallet_type'),
        SecureStore.getItemAsync('kyc_completed'),
        SecureStore.getItemAsync('kyc_data'),
      ]);

      if (savedStep) setCurrentStep(savedStep as OnboardingStep);
      if (savedWalletAddress) setWalletAddress(savedWalletAddress);
      if (savedWalletBalance) setWalletBalance(parseFloat(savedWalletBalance));
      if (savedWalletType) setWalletType(savedWalletType);
      if (savedKYCStatus) setIsKYCCompleted(JSON.parse(savedKYCStatus));
      if (savedKYCData) {
        const parsedKYCData = JSON.parse(savedKYCData);
        // Mask sensitive data for display
        if (parsedKYCData.extractedData?.aadhaarNumber) {
          parsedKYCData.extractedData.aadhaarNumber = maskAadhaar(parsedKYCData.extractedData.aadhaarNumber);
        }
        setKYCDataState(parsedKYCData);
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  };

  const maskAadhaar = (aadhaar: string): string => {
    if (aadhaar.length >= 4) {
      return `XXXX XXXX ${aadhaar.slice(-4)}`;
    }
    return aadhaar;
  };

  const setCurrentStepWithPersistence = async (step: OnboardingStep) => {
    setCurrentStep(step);
    try {
      await SecureStore.setItemAsync('onboarding_step', step);
    } catch (error) {
      console.error('Error saving step:', error);
    }
  };

  const nextStep = async () => {
    const stepOrder: OnboardingStep[] = ['circom', 'welcome', 'wallet', 'kyc', 'keys', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      await setCurrentStepWithPersistence(stepOrder[currentIndex + 1]);
    }
  };

  const setWalletConnection = async (address: string, balance: number, type: string) => {
    setWalletAddress(address);
    setWalletBalance(balance);
    setWalletType(type);
    
    try {
      await Promise.all([
        SecureStore.setItemAsync('wallet_address', address),
        SecureStore.setItemAsync('wallet_balance', balance.toString()),
        SecureStore.setItemAsync('wallet_type', type),
      ]);
    } catch (error) {
      console.error('Error saving wallet data:', error);
    }
  };

  const setKYCData = async (data: KYCData) => {
    // Store original data securely with masked sensitive information
    const maskedData = {
      ...data,
      extractedData: data.extractedData ? {
        ...data.extractedData,
        aadhaarNumber: data.extractedData.aadhaarNumber ? maskAadhaar(data.extractedData.aadhaarNumber) : undefined,
      } : null,
    };
    
    setKYCDataState(maskedData);
    
    try {
      await SecureStore.setItemAsync('kyc_data', JSON.stringify(maskedData));
    } catch (error) {
      console.error('Error saving KYC data:', error);
    }
  };

  const completeKYC = async () => {
    setIsKYCCompleted(true);
    
    try {
      await SecureStore.setItemAsync('kyc_completed', JSON.stringify(true));
    } catch (error) {
      console.error('Error saving KYC status:', error);
    }
  };

  const resetOnboarding = async () => {
    setCurrentStep('welcome');
    setWalletAddress('');
    setWalletBalance(0);
    setWalletType('');
    setIsKYCCompleted(false);
    setKYCDataState(null);
    
    try {
      await Promise.all([
        SecureStore.deleteItemAsync('onboarding_step'),
        SecureStore.deleteItemAsync('wallet_address'),
        SecureStore.deleteItemAsync('wallet_balance'),
        SecureStore.deleteItemAsync('wallet_type'),
        SecureStore.deleteItemAsync('kyc_completed'),
        SecureStore.deleteItemAsync('kyc_data'),
      ]);
    } catch (error) {
      console.error('Error clearing persisted data:', error);
    }
  };

  const value: OnboardingContextType = {
    currentStep,
    walletAddress,
    walletBalance,
    walletType,
    isKYCCompleted,
    kycData,
    setCurrentStep: setCurrentStepWithPersistence,
    nextStep,
    setWalletConnection,
    setKYCData,
    completeKYC,
    resetOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
