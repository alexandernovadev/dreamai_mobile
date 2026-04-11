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
import { formFieldStyles, formFieldBase } from './formFieldStyles';

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
    <View style={[formFieldStyles.container, containerStyle]}>
      {label ? (
        <Text style={formFieldStyles.label} nativeID={`${label}-label`}>
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
          formFieldBase,
          { minHeight: 48 },
          focused && !error && formFieldStyles.focused,
          !!error && formFieldStyles.errorBorder,
          disabled && formFieldStyles.disabled,
          inputStyle,
        ]}
      />
      {error ? <Text style={formFieldStyles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={formFieldStyles.hint}>{hint}</Text> : null}
    </View>
  );
}
