import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SIGNAL_ENTITY_SECTIONS } from '@/services/signalEntities';
import { colors, gradients, spacing, typography } from '@/theme';

/** Step 1 stub: full entity list + pagination will replace this screen. */
export default function EntityListStubScreen() {
  const { entity } = useLocalSearchParams<{ entity: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bg = gradients.background;

  const slug = (entity ?? '').toLowerCase();
  const known = SIGNAL_ENTITY_SECTIONS.find((s) => s.listSlug === slug);
  const heading = known?.title ?? 'Catalog';

  return (
    <LinearGradient
      colors={[...bg.colors]}
      start={bg.start}
      end={bg.end}
      style={styles.root}
    >
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.screenTitle} numberOfLines={1}>
            {heading}
          </Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.center}>
          <View style={styles.iconWrap}>
            <Ionicons name="construct-outline" size={40} color={colors.accentMuted} />
          </View>
          <Text style={styles.title}>Coming soon</Text>
          <Text style={styles.desc}>
            Full list and pagination for this catalog will appear here in a later
            step.
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  screenTitle: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  topBarSpacer: {
    width: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(124, 92, 196, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  desc: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
});
