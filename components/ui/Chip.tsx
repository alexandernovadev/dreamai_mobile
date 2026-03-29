import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/theme';

export type ChipVariant =
  | 'purple'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'rose'
  | 'teal'
  | 'orange'
  | 'neutral';

const CHIP_COLORS: Record<ChipVariant, { bg: string; text: string; border: string }> = {
  purple: { bg: 'rgba(124, 92, 196, 0.18)', text: '#c4b0f0', border: 'rgba(124, 92, 196, 0.35)' },
  blue: { bg: 'rgba(80, 168, 255, 0.18)', text: '#8cc8ff', border: 'rgba(80, 168, 255, 0.35)' },
  green: { bg: 'rgba(64, 240, 160, 0.18)', text: '#80f0b8', border: 'rgba(64, 240, 160, 0.35)' },
  yellow: { bg: 'rgba(240, 200, 0, 0.18)', text: '#f0d860', border: 'rgba(240, 200, 0, 0.35)' },
  rose: { bg: 'rgba(240, 80, 112, 0.18)', text: '#f898b0', border: 'rgba(240, 80, 112, 0.35)' },
  teal: { bg: 'rgba(24, 160, 136, 0.18)', text: '#68d8c0', border: 'rgba(24, 160, 136, 0.35)' },
  orange: { bg: 'rgba(200, 104, 32, 0.18)', text: '#f0a860', border: 'rgba(200, 104, 32, 0.35)' },
  neutral: { bg: 'rgba(180, 180, 200, 0.12)', text: colors.textSecondary, border: 'rgba(180, 180, 200, 0.25)' },
};

export type ChipProps = {
  label: string;
  variant?: ChipVariant;
  selected?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Chip({
  label,
  variant = 'purple',
  selected = false,
  icon,
  onPress,
  onRemove,
  disabled = false,
  style,
}: ChipProps) {
  const c = CHIP_COLORS[variant];
  const isInteractive = !!onPress;

  return (
    <Pressable
      accessibilityRole={isInteractive ? 'button' : 'text'}
      disabled={disabled || !isInteractive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? c.bg.replace('0.18', '0.35') : c.bg,
          borderColor: selected ? c.text : c.border,
        },
        disabled && styles.disabled,
        pressed && isInteractive && styles.pressed,
        style,
      ]}
    >
      {icon && (
        <Ionicons name={icon} size={14} color={c.text} style={styles.icon} />
      )}
      <Text style={[styles.label, { color: c.text }]} numberOfLines={1}>
        {label}
      </Text>
      {onRemove && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quitar"
          hitSlop={6}
          onPress={onRemove}
          style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.5 }]}
        >
          <Ionicons name="close" size={14} color={c.text} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  icon: {
    marginRight: -2,
  },
  removeBtn: {
    marginLeft: 2,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.8,
  },
});
