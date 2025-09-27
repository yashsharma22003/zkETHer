import { StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from './theme';

// Global styles matching PWA's base styles
export const globalStyles = StyleSheet.create({
  // Container styles
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 50, // Add space for mobile status bar
  },
  
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Status bar styles (matching PWA status bar)
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  
  statusBarText: {
    fontSize: fontSize.xs,
    fontFamily: 'Courier New', // Monospace
    color: colors.foreground,
  },
  
  // Header styles (matching PWA header)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontFamily: 'Courier New',
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    letterSpacing: 2,
  },
  
  // Card styles (exact match from PWA)
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  
  cardHeader: {
    marginBottom: spacing.md,
  },
  
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },
  
  cardContent: {
    // No additional styles - content specific
  },
  
  // Text styles
  textPrimary: {
    color: colors.foreground,
    fontSize: fontSize.base,
  },
  
  textSecondary: {
    color: colors['muted-foreground'],
    fontSize: fontSize.sm,
  },
  
  textAccent: {
    color: colors.accent,
    fontSize: fontSize.base,
  },
  
  textMono: {
    fontFamily: 'Courier New',
    color: colors.foreground,
  },
  
  // Button base styles
  buttonBase: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  buttonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    fontFamily: 'Courier New',
  },
  
  // Input styles
  input: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    color: colors.foreground,
    fontFamily: 'Courier New',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  
  modalContent: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    maxWidth: '100%',
    width: '100%',
    maxHeight: '90%',
  },
  
  // Spacing utilities
  marginTop: {
    marginTop: spacing.md,
  },
  
  marginBottom: {
    marginBottom: spacing.md,
  },
  
  paddingHorizontal: {
    paddingHorizontal: spacing.md,
  },
  
  paddingVertical: {
    paddingVertical: spacing.md,
  },
  
  // Flex utilities
  flexRow: {
    flexDirection: 'row',
  },
  
  flexColumn: {
    flexDirection: 'column',
  },
  
  justifyCenter: {
    justifyContent: 'center',
  },
  
  alignCenter: {
    alignItems: 'center',
  },
  
  justifyBetween: {
    justifyContent: 'space-between',
  },
  
  flex1: {
    flex: 1,
  },
  
  // Nothing Phone specific styles
  breathingDots: {
    // Will be animated
    opacity: 1,
  },
  
  dotMatrix: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // India Ready badge (from PWA)
  indiaReadyBadge: {
    backgroundColor: `${colors.accent}20`,
    borderColor: `${colors.accent}30`,
    borderWidth: 1,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  
  indiaReadyText: {
    fontSize: fontSize.xs,
    fontFamily: 'Courier New',
    color: colors.accent,
  },
});
