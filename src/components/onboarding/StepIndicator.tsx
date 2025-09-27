import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize } from '../../styles/theme';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  stepDescription?: string;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepTitle,
  stepDescription
}) => {
  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(currentStep / totalSteps) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentStep} of {totalSteps}
        </Text>
      </View>

      {/* Step Dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < currentStep ? styles.dotCompleted : 
              index === currentStep - 1 ? styles.dotActive : styles.dotInactive
            ]}
          >
            {index < currentStep ? (
              <Text style={styles.dotCheckmark}>✓</Text>
            ) : (
              <Text style={styles.dotNumber}>{index + 1}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Step Info */}
      <View style={styles.stepInfo}>
        <Text style={styles.stepTitle}>{stepTitle}</Text>
        {stepDescription && (
          <Text style={styles.stepDescription}>{stepDescription}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.xs,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  
  progressText: {
    fontSize: fontSize.sm,
    color: colors['muted-foreground'],
    fontFamily: 'Courier New',
  },
  
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  
  dotActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  
  dotCompleted: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  
  dotInactive: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  
  dotNumber: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors['muted-foreground'],
    fontFamily: 'Courier New',
  },
  
  dotCheckmark: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.background,
  },
  
  stepInfo: {
    alignItems: 'center',
  },
  
  stepTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.foreground,
    fontFamily: 'Courier New',
    marginBottom: spacing.xs,
  },
  
  stepDescription: {
    fontSize: fontSize.sm,
    color: colors['muted-foreground'],
    fontFamily: 'Courier New',
    textAlign: 'center',
  },
});

export default StepIndicator;
