import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { globalStyles } from '../../styles/globalStyles';
import { colors } from '../../styles/colors';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface DocumentData {
  uri: string;
  type: 'image' | 'pdf';
  name: string;
  size: number;
}

interface DocumentUploadScreenProps {
  onNext: (data: { aadhaarDocument: DocumentData | null; panDocument: DocumentData | null }) => void;
  onBack: () => void;
}

export default function DocumentUploadScreen({ onNext, onBack }: DocumentUploadScreenProps) {
  const [documents, setDocuments] = useState({
    aadhaarDocument: null as DocumentData | null,
    panDocument: null as DocumentData | null,
  });
  const [uploading, setUploading] = useState({
    aadhaar: false,
    pan: false,
  });

  // Create secure directory for KYC documents
  const createKYCDirectory = async () => {
    const kycDir = `${FileSystem.documentDirectory}kyc_documents/`;
    const dirInfo = await FileSystem.getInfoAsync(kycDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(kycDir, { intermediates: true });
    }
    return kycDir;
  };

  // Save file to secure location
  const saveFileSecurely = async (sourceUri: string, fileName: string): Promise<string> => {
    const kycDir = await createKYCDirectory();
    const destinationUri = `${kycDir}${fileName}`;
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });
    return destinationUri;
  };

  const handleDocumentUpload = (documentType: 'aadhaar' | 'pan') => {
    Alert.alert(
      'Upload Document',
      `Choose how to upload your ${documentType === 'aadhaar' ? 'Aadhaar Card' : 'PAN Card'}`,
      [
        {
          text: 'Take Photo',
          onPress: () => takePhoto(documentType),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => pickFromGallery(documentType),
        },
        {
          text: 'Upload PDF',
          onPress: () => pickDocument(documentType),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const takePhoto = async (documentType: 'aadhaar' | 'pan') => {
    try {
      setUploading(prev => ({ ...prev, [documentType]: true }));

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = `${documentType}_${Date.now()}.jpg`;
        const secureUri = await saveFileSecurely(asset.uri, fileName);
        
        const documentData: DocumentData = {
          uri: secureUri,
          type: 'image',
          name: fileName,
          size: asset.fileSize || 0,
        };

        setDocuments(prev => ({
          ...prev,
          [`${documentType}Document`]: documentData,
        }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setUploading(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const pickFromGallery = async (documentType: 'aadhaar' | 'pan') => {
    try {
      setUploading(prev => ({ ...prev, [documentType]: true }));

      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery permission is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = `${documentType}_${Date.now()}.jpg`;
        const secureUri = await saveFileSecurely(asset.uri, fileName);
        
        const documentData: DocumentData = {
          uri: secureUri,
          type: 'image',
          name: fileName,
          size: asset.fileSize || 0,
        };

        setDocuments(prev => ({
          ...prev,
          [`${documentType}Document`]: documentData,
        }));
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setUploading(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const pickDocument = async (documentType: 'aadhaar' | 'pan') => {
    try {
      setUploading(prev => ({ ...prev, [documentType]: true }));

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileExtension = asset.name.split('.').pop()?.toLowerCase();
        const fileName = `${documentType}_${Date.now()}.${fileExtension}`;
        const secureUri = await saveFileSecurely(asset.uri, fileName);
        
        const documentData: DocumentData = {
          uri: secureUri,
          type: fileExtension === 'pdf' ? 'pdf' : 'image',
          name: fileName,
          size: asset.size || 0,
        };

        setDocuments(prev => ({
          ...prev,
          [`${documentType}Document`]: documentData,
        }));
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
    } finally {
      setUploading(prev => ({ ...prev, [documentType]: false }));
    }
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
    document: DocumentData | null,
    isUploading: boolean
  ) => (
    <Card style={styles.documentCard}>
      <CardContent>
        <Text style={styles.documentTitle}>{title}</Text>
        
        <TouchableOpacity
          style={[styles.uploadArea, document && styles.uploadAreaSuccess]}
          onPress={() => handleDocumentUpload(documentType)}
          disabled={isUploading}
        >
          <View style={styles.uploadContent}>
            {isUploading ? (
              <>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.uploadText}>Uploading...</Text>
              </>
            ) : document ? (
              <>
                {document.type === 'image' && (
                  <Image source={{ uri: document.uri }} style={styles.documentPreview} />
                )}
                {document.type === 'pdf' && (
                  <Text style={styles.uploadIconSuccess}>📄</Text>
                )}
                <Text style={styles.uploadTextSuccess}>
                  {document.type === 'pdf' ? 'PDF Uploaded' : 'Photo Uploaded'}
                </Text>
                <Text style={styles.uploadSubtext}>
                  {document.name} • {(document.size / 1024).toFixed(1)}KB
                </Text>
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
          documents.aadhaarDocument,
          uploading.aadhaar
        )}

        {/* PAN Card Upload */}
        {renderUploadCard(
          'PAN Card',
          'pan',
          'Name, PAN number, Father\'s name, DOB',
          documents.panDocument,
          uploading.pan
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
  documentPreview: {
    width: 80,
    height: 60,
    borderRadius: 4,
    marginBottom: 8,
    backgroundColor: colors.background,
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
