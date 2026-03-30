import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

type Props = {
  title: string;
  onSeeAll: () => void;
  children: ReactNode;
};

/** Section header row + horizontal content (carousel). Step 1: shells only. */
export function SignalsSection({ title, onSeeAll, children }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`See all ${title}`}
          onPress={onSeeAll}
          style={({ pressed }) => [styles.seeAll, pressed && styles.seeAllPressed]}
        >
          <Text style={styles.seeAllText}>See all</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingRight: 0,
  },
  title: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    letterSpacing: 0.2,
  },
  seeAll: {
    paddingVertical: spacing.xs,
    paddingLeft: spacing.sm,
  },
  seeAllPressed: {
    opacity: 0.75,
  },
  seeAllText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
  },
});
