import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { ViewToken } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ScreenShell } from '@/components/layout/ScreenShell';
import { Ionicons } from '@expo/vector-icons';
import { DreamSessionReadView } from '@/components/dreams/DreamSessionReadView';
import { DREAM_LIST_QUERY_PARAMS } from '@/lib/dreamListQuery';
import { queryKeys } from '@/lib/queryKeys';
import {
  apiErrorMessage,
  dreamSessionsService,
  type DreamSession,
} from '@/services';
import { colors, radius, spacing, typography } from '@/theme';

// ─── Per-page hydrated loader ─────────────────────────────────────────────────

type DreamBookPageProps = {
  session: DreamSession;
  pageWidth: number;
  pageHeight: number;
};

function DreamBookPage({ session, pageWidth, pageHeight }: DreamBookPageProps) {
  const hydratedQuery = useQuery({
    queryKey: queryKeys.dreamSessions.hydrated(session.id),
    queryFn: () => dreamSessionsService.getHydrated(session.id),
    staleTime: 30_000,
  });

  const hydratedSession = hydratedQuery.data?.session ?? null;
  const hydrated = hydratedQuery.data?.hydrated ?? null;
  const loading = hydratedQuery.isPending;
  const error = hydratedQuery.error ? apiErrorMessage(hydratedQuery.error) : null;

  // Don't render until the pager has measured itself
  if (pageHeight === 0) {
    return <View style={{ width: pageWidth }} />;
  }

  return (
    <View style={[ps.page, { width: pageWidth, height: pageHeight }]}>
      {loading ? (
        <View style={ps.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={ps.muted}>Cargando sueño…</Text>
        </View>
      ) : error ? (
        <View style={ps.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={40}
            color={colors.textMuted}
          />
          <Text style={ps.errorText}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void hydratedQuery.refetch()}
            style={({ pressed }) => [ps.retryBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={ps.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : hydratedSession && hydrated ? (
        <DreamSessionReadView session={hydratedSession} hydrated={hydrated} />
      ) : null}
    </View>
  );
}

const ps = StyleSheet.create({
  page: {
    paddingHorizontal: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  muted: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  retryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
  },
  retryText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
  },
});

// ─── Book screen ──────────────────────────────────────────────────────────────

export default function DreamBookScreen() {
  const { startId: startIdParam } =
    useLocalSearchParams<{ startId?: string }>();
  const startId = Array.isArray(startIdParam)
    ? startIdParam[0]
    : startIdParam;

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const flatListRef = useRef<FlatList<DreamSession>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pagerHeight, setPagerHeight] = useState(0);
  // Tracks the last startId we already scrolled to, to avoid repeated jumps
  const lastScrolledId = useRef<string | undefined>(undefined);

  // ── List query ──────────────────────────────────────────────────────────────
  const listQuery = useQuery({
    queryKey: queryKeys.dreamSessions.list(DREAM_LIST_QUERY_PARAMS),
    queryFn: () => dreamSessionsService.list(DREAM_LIST_QUERY_PARAMS),
  });

  const dreams = listQuery.data?.data ?? [];
  const listError = listQuery.error ? apiErrorMessage(listQuery.error) : null;
  const loading = listQuery.isPending && dreams.length === 0;

  useFocusEffect(
    useCallback(() => {
      // Allow re-scroll to startId whenever the screen regains focus
      lastScrolledId.current = undefined;
      void listQuery.refetch();
    }, [listQuery.refetch]),
  );

  // ── Scroll to startId once list is ready ─────────────────────────────────
  useEffect(() => {
    if (!startId || dreams.length === 0) return;
    if (lastScrolledId.current === startId) return;

    const idx = dreams.findIndex((d) => d.id === startId);
    if (idx < 0) return;

    lastScrolledId.current = startId;

    if (idx === 0) {
      setCurrentIndex(0);
      return;
    }

    // Small delay to allow FlatList to complete layout
    const t = setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: idx * screenWidth,
        animated: false,
      });
      setCurrentIndex(idx);
    }, 80);
    return () => clearTimeout(t);
  }, [startId, dreams, screenWidth]);

  // ── Viewability tracking ─────────────────────────────────────────────────
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // ── Prev / Next helpers ──────────────────────────────────────────────────
  function goPrev() {
    if (currentIndex <= 0) return;
    const next = currentIndex - 1;
    flatListRef.current?.scrollToOffset({
      offset: next * screenWidth,
      animated: true,
    });
    setCurrentIndex(next);
  }

  function goNext() {
    if (currentIndex >= dreams.length - 1) return;
    const next = currentIndex + 1;
    flatListRef.current?.scrollToOffset({
      offset: next * screenWidth,
      animated: true,
    });
    setCurrentIndex(next);
  }

  const total = dreams.length;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex >= total - 1;

  return (
    <ScreenShell>
        {/* ── Header ── */}
        <View style={s.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.5 }]}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </Pressable>
          <View style={s.headerText}>
            <Text style={s.title}>Libro de sueños</Text>
            {total > 0 ? (
              <Text style={s.subtitle}>
                Página {currentIndex + 1} / {total}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ── Body ── */}
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={s.muted}>Cargando sueños…</Text>
          </View>
        ) : listError && dreams.length === 0 ? (
          <View style={s.center}>
            <Ionicons
              name="cloud-offline-outline"
              size={48}
              color={colors.textMuted}
            />
            <Text style={s.errorText}>{listError}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void listQuery.refetch()}
              style={({ pressed }) => [s.retryBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={s.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : dreams.length === 0 ? (
          <View style={s.center}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="book-outline" size={48} color={colors.accentMuted} />
            </View>
            <Text style={s.emptyTitle}>El libro está vacío</Text>
            <Text style={s.emptyDesc}>
              Registra tu primer sueño para comenzar tu libro onírico.
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={dreams}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              getItemLayout={(_, index) => ({
                length: screenWidth,
                offset: screenWidth * index,
                index,
              })}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              style={s.pager}
              onLayout={(e) => setPagerHeight(e.nativeEvent.layout.height)}
              renderItem={({ item }) => (
                <DreamBookPage
                  session={item}
                  pageWidth={screenWidth}
                  pageHeight={pagerHeight}
                />
              )}
            />

            {/* ── Footer navigation ── */}
            <View
              style={[
                s.footer,
                { paddingBottom: insets.bottom + spacing.md },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Página anterior"
                disabled={isFirst}
                onPress={goPrev}
                style={({ pressed }) => [
                  s.navBtn,
                  isFirst && s.navBtnDisabled,
                  pressed && !isFirst && { opacity: 0.85 },
                ]}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={isFirst ? colors.textMuted : colors.text}
                />
                <Text
                  style={[
                    s.navBtnLabel,
                    isFirst && s.navBtnLabelDisabled,
                  ]}
                >
                  Anterior
                </Text>
              </Pressable>

              {total <= 15 ? (
                <View style={s.dotRow}>
                  {dreams.map((d, i) => (
                    <View
                      key={d.id}
                      style={[s.dot, i === currentIndex && s.dotActive]}
                    />
                  ))}
                </View>
              ) : (
                <View style={s.pageChip}>
                  <Text style={s.pageChipText}>
                    {currentIndex + 1} / {total}
                  </Text>
                </View>
              )}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Página siguiente"
                disabled={isLast}
                onPress={goNext}
                style={({ pressed }) => [
                  s.navBtn,
                  isLast && s.navBtnDisabled,
                  pressed && !isLast && { opacity: 0.85 },
                ]}
              >
                <Text
                  style={[
                    s.navBtnLabel,
                    isLast && s.navBtnLabelDisabled,
                  ]}
                >
                  Siguiente
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={isLast ? colors.textMuted : colors.text}
                />
              </Pressable>
            </View>
          </>
        )}
    </ScreenShell>
  );
}

const s = StyleSheet.create({

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  backBtn: { marginLeft: -spacing.xs, padding: spacing.xs },
  headerText: { flex: 1 },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  pager: { flex: 1 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  muted: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
  },
  retryText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(124, 92, 196, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  navBtnLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  navBtnLabelDisabled: {
    color: colors.textMuted,
  },
  dotRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  pageChip: {
    flex: 1,
    alignItems: 'center',
  },
  pageChipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textMuted,
  },
});
