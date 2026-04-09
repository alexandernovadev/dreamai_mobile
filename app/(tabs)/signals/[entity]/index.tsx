import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell } from '@/components/layout/ScreenShell';
import { EntityCatalogGridItem } from '@/components/signals/EntityCatalogGridItem';
import { queryKeys } from '@/lib/queryKeys';
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
import { colors, spacing, typography } from '@/theme';

function isSignalSlug(s: string): s is SignalEntityListSlug {
  return SIGNAL_ENTITY_SECTIONS.some((x) => x.listSlug === s);
}

const GRID_COLS = 5;
const GRID_GAP = spacing.sm;

/** /signals/:entity — full catalog list (e.g. /signals/characters). */
export default function SignalsEntityListScreen() {
  const { entity } = useLocalSearchParams<{ entity: string }>();
  const router = useRouter();

  const { width: windowWidth } = useWindowDimensions();
  const slug = (entity ?? '').toLowerCase();
  const known = SIGNAL_ENTITY_SECTIONS.find((s) => s.listSlug === slug);
  const heading = known?.title ?? 'Catalog';

  const gridContentWidth = windowWidth - spacing.xl * 2;
  const gridCellWidth =
    (gridContentWidth - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

  const slugOk = isSignalSlug(slug);

  const listQuery = useInfiniteQuery({
    queryKey: queryKeys.signals.catalogList(slug as SignalEntityListSlug),
    queryFn: ({ pageParam }) =>
      fetchEntityListPage(
        slug as SignalEntityListSlug,
        pageParam,
        ENTITY_CATALOG_PAGE_SIZE,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    enabled: slugOk,
  });

  const items = useMemo(
    () => listQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [listQuery.data],
  );

  const errorMsg = listQuery.error
    ? apiErrorMessage(listQuery.error)
    : null;

  const loading = listQuery.isPending && items.length === 0;
  const refreshing =
    listQuery.isRefetching && !listQuery.isFetchingNextPage;

  const onRefresh = useCallback(() => {
    void listQuery.refetch();
  }, [listQuery]);

  const onEndReached = useCallback(() => {
    if (!listQuery.hasNextPage || listQuery.isFetchingNextPage) return;
    void listQuery.fetchNextPage();
  }, [listQuery]);

  const openDetail = useCallback(
    (item: SignalHubCardItem) => {
      if (!slugOk) return;
      router.push(`/signals/${slug}/${item.id}`);
    },
    [router, slug, slugOk],
  );

  if (!slugOk) {
    return (
      <ScreenShell style={{ paddingHorizontal: spacing.xl }}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.errText}>Invalid catalog</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell style={{ paddingHorizontal: spacing.xl }}>
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

        {errorMsg && !loading ? (
          <View style={styles.banner}>
            <Ionicons name="warning-outline" size={18} color={colors.warning} />
            <Text style={styles.bannerText}>{errorMsg}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            numColumns={GRID_COLS}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => (
              <Pressable
                style={{ width: gridCellWidth }}
                onPress={() => openDetail(item)}
              >
                <EntityCatalogGridItem sectionSlug={slug} item={item} />
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
              listQuery.isFetchingNextPage ? (
                <ActivityIndicator
                  style={styles.footerLoader}
                  color={colors.accent}
                />
              ) : null
            }
            ListEmptyComponent={
              !listQuery.isPending ? (
                <Text style={styles.empty}>No entries yet</Text>
              ) : null
            }
          />
        )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
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
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
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
