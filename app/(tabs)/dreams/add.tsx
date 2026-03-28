import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, typography } from '@/theme';

/** Placeholder for step 2 (capture raw dream). */
export default function AddDreamPlaceholderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bg = gradients.background;

  return (
    <LinearGradient
      colors={[...bg.colors]}
      start={bg.start}
      end={bg.end}
      style={styles.root}
    >
      <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backPressed]}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>New dream</Text>
            <Text style={styles.subtitle}>Coming in the next step.</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  backBtn: {
    marginLeft: -spacing.xs,
    padding: spacing.xs,
  },
  backPressed: { opacity: 0.7 },
  headerText: { flex: 1 },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});
