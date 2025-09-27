import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { globalStyles } from '../../styles/globalStyles';
import { colors } from '../../styles/colors';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface DocumentUploadScreenProps {
  onNext: (data: { aadhaarDocument: string | null; panDocument: string | null }) => void;
  onBack: () => void;
}

export default function DocumentUploadScreen({ onNext, onBack }: DocumentUploadScreenProps) {
  const [documents, setDocuments] = useState({
    aadhaarDocument: null as string | null,
    panDocument: null as string | null,
  });

  const handleDocumentUpload = (documentType: 'aadhaar' | 'pan') => {
    // Mock document upload - in real app this would open camera/file picker
    Alert.alert(
      'Upload Document',
      `Choose how to upload your ${documentType === 'aadhaar' ? 'Aadhaar Card' : 'PAN Card'}`,
      [
        {
          text: 'Take Photo',
          onPress: () => mockUpload(documentType, 'photo'),
        },
        {
          text: 'Upload PDF',
          onPress: () => mockUpload(documentType, 'pdf'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const mockUpload = (documentType: 'aadhaar' | 'pan', uploadType: 'photo' | 'pdf') => {
    // Mock successful upload
    setTimeout(() => {
      setDocuments(prev => ({
        ...prev,
        [`${documentType}Document`]: `${documentType}_${uploadType}_${Date.now()}`,
      }));
    }, 1000);
  };

  const isFormValid = documents.aadhaarDocument && documents.panDocument;

  const handleContinue = () => {
    if (isFormValid) {
      onNext(documents);
    }
  };

  const renderUploadCard = (
    title: string,
    documentType: 'aadhaar' | 'pan',
    extractedInfo: string,
    isUploaded: boolean
  ) => (
    <Card style={styles.documentCard}>
      <CardContent>
        <Text style={styles.documentTitle}>{title}</Text>
        
        <TouchableOpacity
          style={[styles.uploadArea, isUploaded && styles.uploadAreaSuccess]}
          onPress={() => handleDocumentUpload(documentType)}
        >
          <View style={styles.uploadContent}>
            {isUploaded ? (
              <>
                <Text style={styles.uploadIconSuccess}>✓</Text>
                <Text style={styles.uploadTextSuccess}>Document Uploaded</Text>
                <Text style={styles.uploadSubtext}>Tap to change</Text>
              </>
            ) : (
              <>
                <Text style={styles.uploadIcon}>📄</Text>
                <Text style={styles.uploadText}>Tap to upload PDF</Text>
                <Text style={styles.uploadSubtext}>or take photo</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.extractionInfo}>
          We'll extract: {extractedInfo}
        </Text>
      </CardContent>
    </Card>
  );

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backArrow}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepContainer}>
        <Text style={styles.stepText}>Step 2 of 3</Text>
        <Text style={styles.stepTitle}>Upload Documents</Text>
      </View>

      <View style={styles.content}>
        {/* Aadhaar Card Upload */}
        {renderUploadCard(
          'Aadhaar Card',
          'aadhaar',
          'Name, DOB, Aadhaar number, Address',
          !!documents.aadhaarDocument
        )}

        {/* PAN Card Upload */}
        {renderUploadCard(
          'PAN Card',
          'pan',
          'Name, PAN number, Father\'s name, DOB',
          !!documents.panDocument
        )}

        {/* Continue Button */}
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!isFormValid}
          style={styles.continueButton}
        />

        {/* Info Message */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoIcon}>🤖</Text>
          <Text style={styles.infoText}>OCR + API verification automatic</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  backArrow: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  stepContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  stepText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  documentCard: {
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: colors.background,
  },
  uploadAreaSuccess: {
    borderColor: colors.accent,
    borderStyle: 'solid',
    backgroundColor: `${colors.accent}10`,
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  uploadIconSuccess: {
    fontSize: 24,
    color: colors.accent,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    color: colors.text.primary,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  uploadTextSuccess: {
    fontSize: 14,
    color: colors.accent,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  extractionInfo: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  continueButton: {
    marginTop: 20,
    marginBottom: 30,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
});
