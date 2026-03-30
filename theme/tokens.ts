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
  /** Text on colored gradient buttons */
  buttonLabel: '#1a1520',
  /** Borde morado oscuro (sin blanco) */
  buttonBorder: 'rgba(72, 48, 118, 0.85)',
  /** Borde botón outline — blanco morado claro */
  buttonOutlineBorder: palette.purple[100],
  /** Halo suave — mismo acento morado */
  buttonGlow: '#3d2868',
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

/** Primary CTA buttons — tonos vivos; sin blanco en los stops. */
export const buttonGradients = {
  yellow: {
    colors: ['#d4a000', '#f0c800', '#ffd818'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  red: {
    colors: ['#d81840', '#f02850', '#ff4870'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  blue: {
    colors: ['#1868e0', '#3088f8', '#50a8ff'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  green: {
    colors: ['#10a058', '#28d080', '#40f0a0'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  /** Morado oscuro — alineado con la marca */
  purple: {
    colors: [palette.purple[900], palette.purple[700], palette.purple[500]] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  /** Misma lógica que purple: oscuro → medio → acento (texto claro en el botón) */
  teal: {
    colors: ['#082220', '#0d5848', '#18a088'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  orange: {
    colors: ['#3a1400', '#703008', '#c86820'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  rose: {
    colors: ['#380818', '#602038', '#985868'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  indigo: {
    colors: ['#080c28', '#182060', '#3848b0'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

/** Variantes con fondo oscuro — usar `colors.text` en la etiqueta. */
export const buttonDarkLabelVariants = [
  'purple',
  'teal',
  'orange',
  'rose',
  'indigo',
] as const satisfies readonly (keyof typeof buttonGradients)[];

/**
 * Insignias tipo logro — metal/gema brillante (estilo Duolingo).
 * Cada variante: tonos oscuros → medios → reflejo claro (sin #fff puro en el cuerpo).
 */
export const badgeGradients = {
  /** Oro clásico */
  gold: {
    colors: ['#6b4a08', '#c9a018', '#f0d040', '#fff0a0'] as const,
    start: { x: 0.15, y: 0.1 },
    end: { x: 0.85, y: 0.95 },
  },
  /** Plata */
  silver: {
    colors: ['#3a4048', '#788898', '#b8c8d8', '#e8f0f8'] as const,
    start: { x: 0.15, y: 0.1 },
    end: { x: 0.85, y: 0.95 },
  },
  /** Bronce / cobre */
  bronze: {
    colors: ['#4a2810', '#986028', '#d89850', '#ffd0a0'] as const,
    start: { x: 0.15, y: 0.1 },
    end: { x: 0.85, y: 0.95 },
  },
  /** Rubí */
  ruby: {
    colors: ['#501018', '#c02040', '#f05070', '#ffb0c8'] as const,
    start: { x: 0.15, y: 0.1 },
    end: { x: 0.85, y: 0.95 },
  },
  /** Esmeralda */
  emerald: {
    colors: ['#083828', '#108858', '#38e098', '#b0ffe8'] as const,
    start: { x: 0.15, y: 0.1 },
    end: { x: 0.85, y: 0.95 },
  },
} as const;

/** Brillo especular encima del metal (overlay). */
export const badgeShineGradient = {
  colors: [
    'rgba(255, 255, 255, 0.55)',
    'rgba(255, 255, 255, 0.08)',
    'rgba(255, 255, 255, 0)',
    'rgba(255, 255, 255, 0.2)',
  ] as const,
  start: { x: 0.2, y: 0 },
  end: { x: 0.9, y: 0.85 },
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
export type ButtonGradientVariant = keyof typeof buttonGradients;
export type ButtonVariant = ButtonGradientVariant | 'outline';
export type BadgeVariant = keyof typeof badgeGradients;
