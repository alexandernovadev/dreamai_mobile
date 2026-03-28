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

export type InputProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function Input({
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
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const disabled = editable === false;

  const a11yLabel = accessibilityLabel ?? label;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label} nativeID={`${label}-label`}>
          {label}
        </Text>
      ) : null}
      <TextInput
        {...textInputProps}
        editable={editable}
        accessibilityLabel={a11yLabel}
        placeholderTextColor={placeholderTextColor ?? colors.textMuted}
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
          focused && !error && styles.inputFocused,
          !!error && styles.inputError,
          disabled && styles.inputDisabled,
          inputStyle,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    fontSize: typography.sizes.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inputFocused: {
    borderColor: colors.accent,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputDisabled: {
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
