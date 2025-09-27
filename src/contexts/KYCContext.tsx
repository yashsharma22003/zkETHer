import React, { createContext, useContext, useState, ReactNode } from 'react';

export type KYCStep = 'contact' | 'documents' | 'biometric' | 'processing';

export interface KYCFormData {
  phoneNumber: string;
  email: string;
  aadhaarDocument: string | null;
  panDocument: string | null;
  biometricData: string | null;
  extractedData: any;
}

interface KYCContextType {
  currentStep: KYCStep;
  formData: KYCFormData;
  setCurrentStep: (step: KYCStep) => void;
  updateFormData: (data: Partial<KYCFormData>) => void;
  resetKYC: () => void;
  getStepNumber: (step: KYCStep) => number;
  getTotalSteps: () => number;
  getStepTitle: (step: KYCStep) => string;
}

const KYCContext = createContext<KYCContextType | undefined>(undefined);

const initialFormData: KYCFormData = {
  phoneNumber: '',
  email: '',
  aadhaarDocument: null,
  panDocument: null,
  biometricData: null,
  extractedData: null,
};

export const KYCProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<KYCStep>('contact');
  const [formData, setFormData] = useState<KYCFormData>(initialFormData);

  const updateFormData = (data: Partial<KYCFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const resetKYC = () => {
    setCurrentStep('contact');
    setFormData(initialFormData);
  };

  const getStepNumber = (step: KYCStep): number => {
    const stepMap: Record<KYCStep, number> = {
      contact: 1,
      documents: 2,
      biometric: 3,
      processing: 4,
    };
    return stepMap[step];
  };

  const getTotalSteps = (): number => 4;

  const getStepTitle = (step: KYCStep): string => {
    const titleMap: Record<KYCStep, string> = {
      contact: 'Contact Information',
      documents: 'Document Upload',
      biometric: 'Biometric Verification',
      processing: 'Document Processing',
    };
    return titleMap[step];
  };

  const value: KYCContextType = {
    currentStep,
    formData,
    setCurrentStep,
    updateFormData,
    resetKYC,
    getStepNumber,
    getTotalSteps,
    getStepTitle,
  };

  return (
    <KYCContext.Provider value={value}>
      {children}
    </KYCContext.Provider>
  );
};

export const useKYC = (): KYCContextType => {
  const context = useContext(KYCContext);
  if (context === undefined) {
    throw new Error('useKYC must be used within a KYCProvider');
  }
  return context;
};
