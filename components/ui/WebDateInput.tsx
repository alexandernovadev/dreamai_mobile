import { createElement } from 'react';
import type { CSSProperties } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export type WebDateInputProps = {
  label?: string;
  /** `YYYY-MM-DD` para `<input type="date" />`. */
  value: string;
  onChangeValue: (value: string) => void;
  disabled?: boolean;
};

/**
 * Solo **web**: `<input type="date">` con estilos CSS del DOM (no `StyleSheet` en el input).
 * Así el navegador abre el date picker nativo; en RN Web el estilo en inputs DOM a menudo falla.
 */
export function WebDateInput({
  label,
  value,
  onChangeValue,
  disabled = false,
}: WebDateInputProps) {
  if (Platform.OS !== 'web') {
    return null;
  }

  const boxStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 44,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    border: `1px solid ${colors.buttonBorder}`,
    boxSizing: 'border-box',
  };

  const inputStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: colors.text,
    fontSize: typography.sizes.md,
    fontFamily: 'inherit',
    colorScheme: 'dark',
    cursor: disabled ? 'not-allowed' : 'pointer',
    padding: 0,
    opacity: disabled ? 0.55 : 1,
  };

  const input = createElement('input', {
    type: 'date',
    value: value || '',
    disabled,
    'aria-label': label ?? 'Fecha',
    onChange: (e: { target: { value: string } }) => {
      const v = e.target.value;
      if (v) onChangeValue(v);
    },
    style: inputStyle,
  });

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {createElement('div', { style: boxStyle }, input)}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
    width: '100%',
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
});
