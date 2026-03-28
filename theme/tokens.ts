import { palette } from './palette';

/**
 * Semantic tokens for UI — always dark. Use these in components.
 */
export const colors = {
  /** Root screen background (solid; pair with gradients separately) */
  background: palette.black,
  /** Slightly lifted surface — cards, sheets */
  surface: palette.purple[950],
  surfaceMuted: palette.neutral[900],
  /** Borders / hairlines */
  border: palette.neutral[700],
  borderSubtle: palette.neutral[800],
  /** Text */
  text: palette.neutral[50],
  textSecondary: palette.neutral[200],
  textMuted: palette.neutral[300],
  textInverse: palette.black,
  /** Brand / interactive */
  accent: palette.purple[400],
  accentMuted: palette.purple[600],
  accentSubtle: palette.purple[800],
  /** Overlays */
  overlay: 'rgba(0, 0, 0, 0.55)',
  scrim: 'rgba(5, 4, 10, 0.85)',
  /** States */
  danger: palette.semantic.danger,
  warning: palette.semantic.warning,
  success: palette.semantic.success,
  info: palette.semantic.info,
} as const;

/**
 * Common gradient stops (e.g. LinearGradient). Background defaults: black → deep purple.
 */
export const gradients = {
  background: {
    colors: [palette.black, palette.purple[950], palette.purple[900]] as const,
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  accent: {
    colors: [palette.purple[600], palette.purple[400], palette.purple[300]] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  skeleton: {
    colors: [palette.neutral[900], palette.neutral[800], palette.neutral[900]] as const,
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  },
} as const;

export const spacing = {
  /** 4 */
  xs: 4,
  /** 8 */
  sm: 8,
  /** 12 */
  md: 12,
  /** 16 */
  lg: 16,
  /** 24 */
  xl: 24,
  /** 32 */
  xxl: 32,
  /** 40 */
  xxxl: 40,
  /** 48 */
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  /** Use with system font or loaded custom font later */
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    hero: 34,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export type ThemeColors = typeof colors;
export type ThemeGradients = typeof gradients;
