import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

/** Estilos compartidos para componentes de formulario (Input, Textarea, Select). */
export const formFieldStyles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
  focused: {
    borderColor: colors.accent,
  },
  errorBorder: {
    borderColor: colors.danger,
  },
  disabled: {
    opacity: 0.45,
  },
  error: {
    marginTop: spacing.sm,
    color: colors.danger,
    fontSize: typography.sizes.sm,
  },
  hint: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
});

/** Estilo base para el campo interactivo (input, textarea, select trigger). */
export const formFieldBase = {
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.buttonBorder,
  backgroundColor: colors.surfaceMuted,
  color: colors.text,
  fontSize: typography.sizes.md,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
} as const;
