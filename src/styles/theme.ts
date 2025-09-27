// zkETHer Nothing Phone Theme System
// Exact conversion from Tailwind CSS to React Native StyleSheet

export const colors = {
  // Nothing Phone Color Palette - Exact Match
  background: '#000000',
  foreground: '#ffffff',
  
  card: '#0a0a0a',
  'card-foreground': '#ffffff',
  
  popover: '#0a0a0a',
  'popover-foreground': '#ffffff',
  
  primary: '#ffffff',
  'primary-foreground': '#000000',
  
  secondary: '#1a1a1a',
  'secondary-foreground': '#ffffff',
  
  muted: '#1a1a1a',
  'muted-foreground': '#888888',
  
  accent: '#00ff88', // Nothing Phone signature green
  'accent-foreground': '#000000',
  
  destructive: '#ff4444',
  'destructive-foreground': '#ffffff',
  
  border: '#2a2a2a',
  input: '#1a1a1a',
  ring: '#00ff88',
  
  // Additional Nothing Phone colors
  dot: '#ffffff',
  'dot-accent': '#00ff88',
  'breathing-dot': '#00ff88',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  },
} as const;

// Typography system matching PWA
export const typography = {
  // Monospace font for technical elements
  fontMono: 'Courier New', // Will be replaced with custom font
  
  // Default font
  fontSans: 'System',
} as const;

// Animation timing - exact match from Framer Motion
export const animations = {
  timing: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: [0.25, 0.1, 0.25, 1],
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
  },
} as const;

// Component variants matching PWA button styles
export const variants = {
  button: {
    default: {
      backgroundColor: colors.primary,
      color: colors['primary-foreground'],
    },
    secondary: {
      backgroundColor: colors.secondary,
      color: colors['secondary-foreground'],
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
      borderWidth: 1,
      color: colors.foreground,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.foreground,
    },
  },
  card: {
    default: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: borderRadius.lg,
    },
  },
} as const;

// Screen dimensions and responsive breakpoints
export const layout = {
  screenPadding: spacing.md,
  cardPadding: spacing.md,
  headerHeight: 60,
  statusBarHeight: 24,
} as const;
