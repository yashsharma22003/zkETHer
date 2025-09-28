import React, { useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { useOnboarding } from '../contexts/OnboardingContext';
import CircomProofScreen from './CircomProofScreen';
import WelcomeScreen from './onboarding/WelcomeScreen';
import WalletConnectionScreen from './onboarding/WalletConnectionScreen';
import KYCVerificationScreen from './onboarding/KYCVerificationScreen';
import GeneratePrivacyKeysScreen from './onboarding/GeneratePrivacyKeysScreen';
import KeyGenerationScreen from './onboarding/KeyGenerationScreen';
import HomeScreen from './HomeScreen';

export default function OnboardingFlow() {
  const { currentStep, setCurrentStep } = useOnboarding();

  useEffect(() => {
    const backAction = () => {
      const stepOrder = ['circom', 'welcome', 'wallet', 'kyc', 'keys', 'complete'];
      const currentIndex = stepOrder.indexOf(currentStep);
      
      if (currentIndex > 0) {
        setCurrentStep(stepOrder[currentIndex - 1] as any);
        return true; // Prevent default back action
      }
      return false; // Allow default back action (exit app)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [currentStep, setCurrentStep]);

  const renderCurrentScreen = () => {
    switch (currentStep) {
      case 'circom':
        return <CircomProofScreen onContinue={() => setCurrentStep('welcome')} />;
      case 'welcome':
        return <WelcomeScreen />;
      case 'wallet':
        return <WalletConnectionScreen />;
      case 'kyc':
        return <KYCVerificationScreen />;
      case 'keys':
        return <GeneratePrivacyKeysScreen />;
      case 'complete':
        return <HomeScreen />;
      default:
        return <CircomProofScreen onContinue={() => setCurrentStep('welcome')} />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {renderCurrentScreen()}
    </View>
  );
}
