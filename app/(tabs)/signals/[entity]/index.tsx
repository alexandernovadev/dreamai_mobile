import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EntityCatalogListRow } from '@/components/signals/EntityCatalogListRow';
import { apiErrorMessage } from '@/services/api';
import {
  ENTITY_CATALOG_PAGE_SIZE,
  fetchEntityListPage,
} from '@/services/entityCatalogList';
import {
  SIGNAL_ENTITY_SECTIONS,
  type SignalEntityListSlug,
} from '@/services/signalEntities';
import type { SignalHubCardItem } from '@/services/signalsHub';
import type { PaginatedMeta } from '@/services/query';
import { colors, gradients, spacing, typography } from '@/theme';

function isSignalSlug(s: string): s is SignalEntityListSlug {
  return SIGNAL_ENTITY_SECTIONS.some((x) => x.listSlug === s);
}

/** /signals/:entity — full catalog list (e.g. /signals/characters). */
export default function SignalsEntityListScreen() {
  const { entity } = useLocalSearchParams<{ entity: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bg = gradients.background;

  const slug = (entity ?? '').toLowerCase();
  const known = SIGNAL_ENTITY_SECTIONS.find((s) => s.listSlug === slug);
  const heading = known?.title ?? 'Catalog';

  const [items, setItems] = useState<SignalHubCardItem[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (
      nextPage: number,
      mode: 'replace' | 'append',
      fromRefresh = false,
    ) => {
      if (!isSignalSlug(slug)) {
        setError('Unknown catalog type');
        setLoading(false);
        return;
      }
      if (mode === 'append') {
        setLoadingMore(true);
      } else if (!fromRefresh) {
        setLoading(true);
      }
      setError(null);
      try {
        const { items: rows, meta: m } = await fetchEntityListPage(
          slug,
          nextPage,
          ENTITY_CATALOG_PAGE_SIZE,
        );
        setMeta(m);
        setItems((prev) => (mode === 'append' ? [...prev, ...rows] : rows));
      } catch (e) {
        setError(apiErrorMessage(e));
        if (mode === 'replace') {
          setItems([]);
          setMeta(null);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    void loadPage(1, 'replace');
  }, [slug, loadPage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadPage(1, 'replace', true);
  }, [loadPage]);

  const onEndReached = useCallback(() => {
    if (!meta || loading || loadingMore || refreshing) return;
    if (meta.page >= meta.totalPages) return;
    void loadPage(meta.page + 1, 'append');
  }, [meta, loading, loadingMore, refreshing, loadPage]);

  const openDetail = useCallback(
    (item: SignalHubCardItem) => {
      if (!isSignalSlug(slug)) return;
      router.push(`/signals/${slug}/${item.id}`);
    },
    [router, slug],
  );

  if (!isSignalSlug(slug)) {
    return (
      <LinearGradient
        colors={[...bg.colors]}
        start={bg.start}
        end={bg.end}
        style={styles.root}
      >
        <View style={[styles.safe, { paddingTop: insets.top }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.errText}>Invalid catalog</Text>
        </View>
      </LinearGradient>
    );
  }

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

        {error && !loading ? (
          <View style={styles.banner}>
            <Ionicons name="warning-outline" size={18} color={colors.warning} />
            <Text style={styles.bannerText}>{error}</Text>
          </View>
        ) : null}

        {loading && items.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            renderItem={({ item }) => (
              <Pressable onPress={() => openDetail(item)}>
                <EntityCatalogListRow sectionSlug={slug} item={item} />
              </Pressable>
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
              />
            }
            onEndReached={onEndReached}
            onEndReachedThreshold={0.35}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator
                  style={styles.footerLoader}
                  color={colors.accent}
                />
              ) : null
            }
            ListEmptyComponent={
              !loading ? (
                <Text style={styles.empty}>No entries yet</Text>
              ) : null
            }
          />
        )}
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
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  bannerText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  errText: {
    marginTop: spacing.lg,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  empty: {
    textAlign: 'center',
    marginTop: spacing.xl,
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
    color: colors.textMuted,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
  },
});
