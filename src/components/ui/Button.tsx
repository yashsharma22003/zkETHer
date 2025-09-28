import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../styles/theme';
import { ButtonProps } from '../../types';

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  style,
}) => {
  const getButtonStyle = () => {
    const baseStyles = [
      styles.button,
      size === 'sm' ? styles.buttonSm : size === 'lg' ? styles.buttonLg : styles.buttonDefault,
      variant === 'secondary' ? styles.buttonSecondary : 
      variant === 'outline' ? styles.buttonOutline :
      variant === 'ghost' ? styles.buttonGhost : styles.buttonPrimary,
    ];
    
    if (disabled || loading) {
      baseStyles.push({ opacity: 0.5 });
    }
    
    return baseStyles;
  };
  
  const getTextStyle = () => {
    const baseStyles = [
      styles.buttonText,
      size === 'sm' ? styles.buttonTextSm : size === 'lg' ? styles.buttonTextLg : {},
      variant === 'secondary' ? styles.buttonTextSecondary :
      variant === 'outline' ? styles.buttonTextOutline :
      variant === 'ghost' ? styles.buttonTextGhost : styles.buttonTextPrimary,
    ];
    
    if (disabled || loading) {
      baseStyles.push(styles.buttonTextDisabled);
    }
    
    return baseStyles;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'default' ? colors['primary-foreground'] : colors.foreground} 
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
  },
  
  // Size variants
  buttonDefault: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
  },
  
  buttonSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 32,
  },
  
  buttonLg: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  
  // Variant styles
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  
  buttonDisabled: {
    opacity: 0.5,
  },
  
  // Text styles
  buttonText: {
    fontFamily: 'Courier New', // Monospace like PWA
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  
  buttonTextSm: {
    fontSize: fontSize.sm,
  },
  
  buttonTextLg: {
    fontSize: fontSize.lg,
  },
  
  // Variant text colors
  buttonTextPrimary: {
    color: colors['primary-foreground'],
    fontSize: fontSize.sm,
  },
  
  buttonTextSecondary: {
    color: colors['secondary-foreground'],
    fontSize: fontSize.sm,
  },
  
  buttonTextOutline: {
    color: colors.foreground,
    fontSize: fontSize.sm,
  },
  
  buttonTextGhost: {
    color: colors.foreground,
    fontSize: fontSize.sm,
  },
  
  buttonTextDisabled: {
    opacity: 0.7,
  },
});

export default Button;
