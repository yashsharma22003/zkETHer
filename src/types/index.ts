// Type definitions matching PWA structure

// Onboarding types (exact match from PWA)
export interface KYCData {
  fullName: string;
  aadhaarNumber: string;
  panNumber: string;
  phoneNumber: string;
  extractedData?: {
    aadhaarNumber?: string;
    panNumber?: string;
    fullName?: string;
  } | null;
}

export type OnboardingStep = 'welcome' | 'wallet' | 'kyc' | 'keys' | 'complete';

export interface OnboardingContextType {
  currentStep: OnboardingStep;
  walletAddress: string;
  walletBalance: number;
  walletType: string;
  isKYCCompleted: boolean;
  kycData: KYCData | null;
  setCurrentStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  setWalletConnection: (address: string, balance: number, type: string) => void;
  setKYCData: (data: KYCData) => void;
  completeKYC: () => void;
  resetOnboarding: () => void;
}

// Transaction types
export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'confirmed' | 'completed';
  timestamp: string;
  txHash?: string;
  privacySet?: number;
  tdsAmount?: number;
  isCompliant?: boolean;
}

// Mock note types (for withdrawal)
export interface MockNote {
  id: string;
  amount: number;
  received: string;
  privacySet: number;
  isRecommended: boolean;
}

// Privacy metrics
export interface PrivacyMetrics {
  anonymitySet: number;
  unlinkability: number;
  mixingRounds: number;
}

// Balance data
export interface BalanceData {
  total: number;
  unlinkable: number;
  notes: number;
}

// Navigation types
export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  Settings: undefined;
  Compliance: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  WalletConnection: undefined;
  KYCVerification: undefined;
  KeyGeneration: undefined;
  Complete: undefined;
};

// Component prop types
export interface ModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}

export interface CardProps {
  children: React.ReactNode;
  style?: any;
}

export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  style?: any;
}

// Animation types
export interface AnimationConfig {
  duration: number;
  easing?: any;
  delay?: number;
}

// Dot matrix pattern types
export type DotMatrixPattern = 'header' | 'privacy' | 'network';
export type DotMatrixSize = 'sm' | 'md' | 'lg';

export interface DotMatrixProps {
  pattern: DotMatrixPattern;
  size?: DotMatrixSize;
  animated?: boolean;
}
