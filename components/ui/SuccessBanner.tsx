import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

export type SuccessBannerProps = {
  message: string;
};

/** Banner compacto de éxito (encima del botón de guardar). */
export function SuccessBanner({ message }: SuccessBannerProps) {
  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite">
      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(64, 240, 160, 0.35)',
    backgroundColor: 'rgba(64, 240, 160, 0.1)',
  },
  text: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
