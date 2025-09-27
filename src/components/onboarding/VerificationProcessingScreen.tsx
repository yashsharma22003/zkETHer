import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { globalStyles } from '../../styles/globalStyles';
import { colors } from '../../styles/colors';
import { Card, CardContent } from '../ui/Card';

interface VerificationProcessingScreenProps {
  onComplete: () => void;
}

interface VerificationStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed';
}

export default function VerificationProcessingScreen({ onComplete }: VerificationProcessingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<VerificationStep[]>([
    { id: '1', label: 'Aadhaar verified', status: 'pending' },
    { id: '2', label: 'PAN verified', status: 'pending' },
    { id: '3', label: 'Face matching...', status: 'pending' },
    { id: '4', label: 'AML screening...', status: 'pending' },
  ]);

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const loadingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start loading animation
    Animated.loop(
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Start verification simulation
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 4 + 1;
        
        // Update steps based on progress
        if (newProgress >= 25 && steps[0].status === 'pending') {
          setSteps(prevSteps => 
            prevSteps.map((step, index) => 
              index === 0 ? { ...step, status: 'completed' } : step
            )
          );
        }
        
        if (newProgress >= 50 && steps[1].status === 'pending') {
          setSteps(prevSteps => 
            prevSteps.map((step, index) => 
              index === 1 ? { ...step, status: 'completed' } : step
            )
          );
        }
        
        if (newProgress >= 75 && steps[2].status === 'pending') {
          setSteps(prevSteps => 
            prevSteps.map((step, index) => 
              index === 2 ? { ...step, status: 'completed' } : step
            )
          );
        }
        
        if (newProgress >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          
          setSteps(prevSteps => 
            prevSteps.map(step => ({ ...step, status: 'completed' }))
          );
          
          // Complete verification after a short delay
          setTimeout(() => {
            onComplete();
          }, 2000);
          
          return 100;
        }
        
        return newProgress;
      });
    }, 150);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [onComplete, steps]);

  const getStatusIcon = (status: VerificationStep['status']) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'processing':
        return '⏳';
      default:
        return '⏳';
    }
  };

  const getStatusColor = (status: VerificationStep['status']) => {
    switch (status) {
      case 'completed':
        return colors.accent;
      case 'processing':
        return '#fbbf24';
      default:
        return colors.text.secondary;
    }
  };

  const rotateInterpolate = loadingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>KYC Verification</Text>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Verifying Identity</Text>
      </View>

      <View style={styles.content}>
        {/* Loading Animation */}
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingIcon,
              { transform: [{ rotate: rotateInterpolate }] }
            ]}
          >
            <Text style={styles.loadingText}>⚙️</Text>
          </Animated.View>
          <Text style={styles.loadingLabel}>Processing your documents</Text>
        </View>

        {/* Verification Steps */}
        <Card style={styles.stepsCard}>
          <CardContent>
            {steps.map((step, index) => (
              <View key={step.id} style={styles.stepItem}>
                <Text style={[styles.stepIcon, { color: getStatusColor(step.status) }]}>
                  {getStatusIcon(step.status)}
                </Text>
                <Text style={[
                  styles.stepText,
                  step.status === 'completed' && styles.stepTextCompleted
                ]}>
                  {step.label}
                </Text>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* Processing Message */}
        <Text style={styles.processingMessage}>
          This may take a few minutes
        </Text>

        {/* Progress Bar */}
        <Card style={styles.progressCard}>
          <CardContent>
            <Text style={styles.progressTitle}>Verification Status</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          </CardContent>
        </Card>

        {/* Status Message */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusIcon}>🔄</Text>
          <Text style={styles.statusText}>Creating your ONCHAINID...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  titleContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  loadingIcon: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 32,
  },
  loadingLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  stepsCard: {
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stepIcon: {
    fontSize: 14,
    marginRight: 12,
    width: 16,
  },
  stepText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    flex: 1,
  },
  stepTextCompleted: {
    color: colors.accent,
  },
  processingMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  progressCard: {
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.text.primary,
    fontFamily: 'monospace',
    minWidth: 30,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
});
