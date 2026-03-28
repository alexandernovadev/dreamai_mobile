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

const DEFAULT_MIN_HEIGHT = 128;

export type TextareaProps = Omit<TextInputProps, 'style' | 'multiline'> & {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  /** Altura mínima en px. */
  minHeight?: number;
  /** Si se define, el texto hace scroll interno al superar esta altura. */
  maxHeight?: number;
};

export function Textarea({
  label,
  error,
  hint,
  containerStyle,
  inputStyle,
  editable = true,
  minHeight = DEFAULT_MIN_HEIGHT,
  maxHeight,
  onFocus,
  onBlur,
  placeholderTextColor,
  accessibilityLabel,
  ...textInputProps
}: TextareaProps) {
  const [focused, setFocused] = useState(false);
  const disabled = editable === false;

  const a11yLabel = accessibilityLabel ?? label;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label} nativeID={`${label}-textarea-label`}>
          {label}
        </Text>
      ) : null}
      <TextInput
        {...textInputProps}
        multiline
        editable={editable}
        accessibilityLabel={a11yLabel}
        placeholderTextColor={placeholderTextColor ?? colors.textMuted}
        textAlignVertical="top"
        scrollEnabled={maxHeight != null}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.textarea,
          { minHeight },
          maxHeight != null && { maxHeight },
          focused && !error && styles.fieldFocused,
          !!error && styles.fieldError,
          disabled && styles.fieldDisabled,
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
  textarea: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    fontSize: typography.sizes.md,
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
