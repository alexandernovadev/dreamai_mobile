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
import { colors } from '@/theme';
import { formFieldStyles, formFieldBase } from './formFieldStyles';

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
    <View style={[formFieldStyles.container, containerStyle]}>
      {label ? (
        <Text style={formFieldStyles.label} nativeID={`${label}-textarea-label`}>
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
          formFieldBase,
          { minHeight },
          maxHeight != null && { maxHeight },
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
