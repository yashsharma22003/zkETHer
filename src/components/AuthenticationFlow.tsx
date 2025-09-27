import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useOnboarding } from '../contexts/OnboardingContext';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/theme';
import PhoneAuthScreen from './onboarding/PhoneAuthScreen';
import OTPVerificationScreen from './onboarding/OTPVerificationScreen';
import WelcomeScreen from './onboarding/WelcomeScreen';

type AuthStep = 'welcome' | 'phone' | 'otp' | 'completed';

const AuthenticationFlow: React.FC = () => {
  const { nextStep } = useOnboarding();
  const [authStep, setAuthStep] = useState<AuthStep>('welcome');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = () => {
    setAuthStep('phone');
  };

  const handleOTPSent = (phone: string) => {
    setPhoneNumber(phone);
    setAuthStep('otp');
  };

  const handleOTPVerified = async () => {
    setIsLoading(true);
    try {
      // Simulate authentication completion
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAuthStep('completed');
      // Move to next onboarding step (wallet connection)
      await nextStep();
    } catch (error) {
      console.error('Authentication completion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    switch (authStep) {
      case 'phone':
        setAuthStep('welcome');
        break;
      case 'otp':
        setAuthStep('phone');
        break;
      default:
        break;
    }
  };

  const handleResendOTP = () => {
    // Trigger OTP resend logic
    console.log('Resending OTP to:', phoneNumber);
  };

  return (
    <View style={[globalStyles.container, styles.container]}>
      {authStep === 'welcome' && (
        <WelcomeScreen onGetStarted={handleGetStarted} />
      )}
      
      {authStep === 'phone' && (
        <PhoneAuthScreen 
          onOTPSent={handleOTPSent}
          onBack={handleBack}
        />
      )}
      
      {authStep === 'otp' && (
        <OTPVerificationScreen
          phoneNumber={phoneNumber}
          onVerified={handleOTPVerified}
          onBack={handleBack}
          onResendOTP={handleResendOTP}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
});

export default AuthenticationFlow;
