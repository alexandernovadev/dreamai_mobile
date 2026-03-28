import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export type CheckboxProps = {
  label?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Checkbox({
  label,
  checked,
  onCheckedChange,
  disabled = false,
  hint,
  containerStyle,
}: CheckboxProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        disabled={disabled}
        onPress={() => onCheckedChange(!checked)}
        style={({ pressed }) => [
          styles.row,
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}
      >
        <View
          style={[
            styles.box,
            checked && styles.boxChecked,
            disabled && styles.boxDisabled,
          ]}
        >
          {checked ? (
            <Ionicons name="checkmark" size={16} color={colors.text} />
          ) : null}
        </View>
        {label ? (
          <Text style={styles.label} numberOfLines={3}>
            {label}
          </Text>
        ) : null}
      </Pressable>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.buttonBorder,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSubtle,
  },
  boxDisabled: {
    borderColor: colors.borderSubtle,
  },
  label: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  hint: {
    marginTop: spacing.sm,
    marginLeft: 22 + spacing.md,
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
});
