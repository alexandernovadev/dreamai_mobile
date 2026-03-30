import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SignalsEntityCard } from '@/components/signals/SignalsEntityCard';
import { SignalsEntityCardShell } from '@/components/signals/SignalsEntityCardShell';
import { SignalsSection } from '@/components/signals/SignalsSection';
import { queryKeys } from '@/lib/queryKeys';
import {
  loadAllSignalHubSections,
  type SignalHubCardItem,
} from '@/services/signalsHub';
import {
  SIGNAL_ENTITY_SECTIONS,
  type SignalEntityListSlug,
} from '@/services/signalEntities';
import { colors, gradients, spacing, typography } from '@/theme';

const CARDS_PER_SECTION = 5;

type HubState = Record<
  SignalEntityListSlug,
  { items: SignalHubCardItem[]; error: string | null }
>;

/**
 * /signals — hub. See all → /signals/:entity (e.g. /signals/characters).
 */
export default function SignalsHubScreen() {
  const bg = gradients.background;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const hubQuery = useQuery({
    queryKey: queryKeys.signals.hub(),
    queryFn: loadAllSignalHubSections,
  });

  const hub: HubState | null = hubQuery.data ?? null;
  const loading = hubQuery.isPending;

  return (
    <LinearGradient
      colors={[...bg.colors]}
      start={bg.start}
      end={bg.end}
      style={styles.root}
    >
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Signals</Text>
          <View style={styles.subtitleRow}>
            <Ionicons name="radio-outline" size={14} color={colors.textMuted} />
            <Text style={styles.subtitle}>
              Recurring figures, places, and threads
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {SIGNAL_ENTITY_SECTIONS.map((section) => {
            const slug = section.listSlug;
            const block = hub?.[slug];
            const error = block?.error ?? null;
            const items = block?.items ?? [];

            return (
              <SignalsSection
                key={slug}
                title={section.title}
                onSeeAll={() => router.push(`/signals/${slug}`)}
              >
                {error ? (
                  <View style={styles.inlineMessage}>
                    <Ionicons name="warning-outline" size={18} color={colors.warning} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    nestedScrollEnabled
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carousel}
                  >
                    {loading
                      ? Array.from({ length: CARDS_PER_SECTION }, (_, i) => (
                          <SignalsEntityCardShell key={i} />
                        ))
                      : items.length === 0
                        ? (
                            <View style={styles.emptyStrip}>
                              <Text style={styles.emptyText}>No entries yet</Text>
                            </View>
                          )
                        : items.map((item) => (
                            <SignalsEntityCard
                              key={item.id}
                              sectionSlug={slug}
                              item={item}
                            />
                          ))}
                  </ScrollView>
                )}
              </SignalsSection>
            );
          })}
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  carousel: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingRight: spacing.xl,
    alignItems: 'stretch',
  },
  inlineMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  errorText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emptyStrip: {
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    minHeight: 120,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
    color: colors.textMuted,
  },
});
