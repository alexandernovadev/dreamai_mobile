import {
  Switch as RNSwitch,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, spacing, typography } from '@/theme';

export type SwitchProps = {
  label?: string;
  hint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Switch({
  label,
  hint,
  value,
  onValueChange,
  disabled = false,
  containerStyle,
}: SwitchProps) {
  return (
    <View style={[styles.container, disabled && styles.disabled, containerStyle]}>
      <View style={[styles.row, !label && styles.rowSwitchOnly]}>
        {label ? (
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
        ) : null}
        <RNSwitch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{
            false: colors.borderSubtle,
            true: colors.accentMuted,
          }}
          thumbColor={colors.text}
          ios_backgroundColor={colors.borderSubtle}
        />
      </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    gap: spacing.md,
  },
  rowSwitchOnly: {
    justifyContent: 'flex-end',
  },
  label: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  labelSpacer: {
    flex: 1,
  },
  hint: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
});
