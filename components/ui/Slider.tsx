import RNSlider from '@react-native-community/slider';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing, typography } from '@/theme';

export type SliderProps = {
  label?: string;
  hint?: string;
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Slider({
  label,
  hint,
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  showValue = true,
  formatValue = (v) => String(Math.round(v)),
  disabled = false,
  containerStyle,
}: SliderProps) {
  return (
    <View style={[styles.container, disabled && styles.disabled, containerStyle]}>
      <View style={styles.header}>
        {label ? (
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
        ) : (
          <View style={styles.flex} />
        )}
        {showValue ? (
          <Text style={styles.value}>{formatValue(value)}</Text>
        ) : null}
      </View>
      <RNSlider
        value={value}
        onValueChange={onValueChange}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        disabled={disabled}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.borderSubtle}
        thumbTintColor={colors.text}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  label: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  value: {
    color: colors.accent,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    minWidth: 40,
    textAlign: 'right',
  },
  hint: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
});
