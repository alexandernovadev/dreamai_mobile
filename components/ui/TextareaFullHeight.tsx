import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export type TextareaFullHeightProps = Omit<
  TextInputProps,
  'style' | 'multiline'
> & {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

/**
 * Multiline input que crece con el contenedor padre (`flex: 1`).
 * El padre debe ser una columna con altura definida (p. ej. `flex: 1`).
 */
export function TextareaFullHeight({
  label,
  error,
  hint,
  containerStyle,
  inputStyle,
  editable = true,
  onFocus,
  onBlur,
  placeholderTextColor,
  accessibilityLabel,
  ...textInputProps
}: TextareaFullHeightProps) {
  const [focused, setFocused] = useState(false);
  const disabled = editable === false;
  const a11yLabel = accessibilityLabel ?? label;

  return (
    <View style={[styles.outer, containerStyle]}>
      {label ? (
        <Text style={styles.label} nativeID={`${label}-textarea-full-label`}>
          {label}
        </Text>
      ) : null}
      <View style={styles.inputShell}>
        <TextInput
          {...textInputProps}
          multiline
          editable={editable}
          accessibilityLabel={a11yLabel}
          placeholderTextColor={placeholderTextColor ?? colors.textMuted}
          textAlignVertical="top"
          scrollEnabled
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            focused && !error && styles.fieldFocused,
            !!error && styles.fieldError,
            disabled && styles.fieldDisabled,
            inputStyle,
          ]}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    width: '100%',
    minHeight: 0,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
  inputShell: {
    flex: 1,
    minHeight: 0,
  },
  input: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    fontSize: typography.sizes.md,
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  fieldFocused: {
    borderColor: colors.accent,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  fieldDisabled: {
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
