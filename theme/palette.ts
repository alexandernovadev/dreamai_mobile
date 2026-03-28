/**
 * Raw color values — black + dark purple base. No light theme.
 */
export const palette = {
  black: '#000000',
  neutral: {
    /** Deep black with a hint of purple */
    950: '#05040a',
    900: '#0a0814',
    800: '#100c1c',
    700: '#161225',
    600: '#1e1830',
    500: '#2a2440',
    400: '#3d3558',
    300: '#5c5278',
    200: '#8a8098',
    100: '#c4bed0',
    50: '#f0eef5',
  },
  purple: {
    /** Darkest usable purples for bg tints */
    950: '#0d0618',
    900: '#140a24',
    800: '#1c0f32',
    700: '#261542',
    600: '#321d56',
    /** Accents */
    500: '#5b3d9e',
    400: '#7c5cc4',
    300: '#9d82e0',
    200: '#c4b0f0',
    100: '#e4daf8',
  },
  semantic: {
    danger: '#e85d6a',
    warning: '#e8b35d',
    success: '#5dd68a',
    info: '#6db3ff',
  },
} as const;

export type Palette = typeof palette;
