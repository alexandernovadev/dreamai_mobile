import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScreenShell } from '@/components/layout/ScreenShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { DREAM_LIST_QUERY_PARAMS } from '@/lib/dreamListQuery';
import { queryKeys } from '@/lib/queryKeys';
import {
  apiErrorMessage,
  dreamSessionsService,
  type DreamSessionStatus,
} from '@/services';
import { colors, radius, spacing, typography, statusTone, statusLabel } from '@/theme';
import { dreamDateLabel, dreamSnippet } from '@/utils/dream';

export default function DreamListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const listQuery = useQuery({
    queryKey: queryKeys.dreamSessions.list(DREAM_LIST_QUERY_PARAMS),
    queryFn: () => dreamSessionsService.list(DREAM_LIST_QUERY_PARAMS),
  });

  const dreams = listQuery.data?.data ?? [];
  const error = listQuery.error ? apiErrorMessage(listQuery.error) : null;
  const loading = listQuery.isPending && dreams.length === 0;
  const refreshing =
    listQuery.isFetching && !listQuery.isPending && dreams.length > 0;
  const availableWidth = Math.max(width - spacing.xl * 2, 0);
  const gridColumns = Math.max(1, Math.min(5, Math.floor(availableWidth / 220)));
  const cardWidth =
    gridColumns > 0
      ? (availableWidth - spacing.md * Math.max(gridColumns - 1, 0)) / gridColumns
      : availableWidth;

  useFocusEffect(
    useCallback(() => {
      void listQuery.refetch();
    }, [listQuery.refetch]),
  );

  function onRefresh() {
    void listQuery.refetch();
  }

  function goView(id: string) {
    router.push({ pathname: '/dream/book', params: { startId: id } });
  }

  function goEdit(id: string) {
    router.push({ pathname: '/dream/edit/[id]', params: { id } });
  }

  return (
    <ScreenShell style={{ paddingHorizontal: spacing.xl }}>
        <ScreenHeader
          title="Sueños"
          subtitle="Tu diario onírico"
          subtitleIcon="moon"
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Vista libro"
              onPress={() => router.push('/dream/book')}
              style={({ pressed }) => [s.bookBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="book-outline" size={16} color={colors.accent} />
              <Text style={s.bookBtnLabel}>Libro</Text>
            </Pressable>
          }
        />

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={s.loadingText}>Cargando sueños…</Text>
          </View>
        ) : error && dreams.length === 0 ? (
          <View style={s.errorBox}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
            <Text style={s.errorText}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void listQuery.refetch()}
              style={({ pressed }) => [s.retryBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={s.retryBtnText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={dreams}
            key={gridColumns}
            keyExtractor={(item) => item.id}
            numColumns={gridColumns}
            contentContainerStyle={[
              s.listContent,
              {
                paddingBottom: insets.bottom + spacing.xxxl + 56,
              },
            ]}
            columnWrapperStyle={gridColumns > 1 ? s.gridRow : undefined}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
              />
            }
            ListEmptyComponent={
              <View style={s.emptyCenter}>
                <View style={s.emptyIconWrap}>
                  <Ionicons name="moon-outline" size={56} color={colors.accentMuted} />
                </View>
                <Text style={s.emptyTitle}>Aún no hay sueños</Text>
                <Text style={s.emptyDesc}>
                  Registra tu primer sueño con el botón +. Aparecerá aquí con fecha y estado.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const tone = statusTone[item.status];
              const coverUri = item.dreamImages[0] ?? null;
              return (
                <View style={[s.cardCol, { width: cardWidth }]}>
                  <View style={s.card}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Ver sueño del ${dreamDateLabel(item)}`}
                      onPress={() => goView(item.id)}
                      style={({ pressed }) => [
                        s.cardMediaPress,
                        pressed && s.cardPressedInner,
                      ]}
                    >
                      {coverUri ? (
                        <Image
                          source={{ uri: coverUri }}
                          style={s.cardImage}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : (
                        <View style={s.cardImageFallback}>
                          <Ionicons
                            name="image-outline"
                            size={28}
                            color={colors.textMuted}
                          />
                        </View>
                      )}
                    </Pressable>

                    <View style={s.cardBody}>
                      <View style={s.cardTop}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Ver sueño del ${dreamDateLabel(item)}`}
                          onPress={() => goView(item.id)}
                          style={({ pressed }) => [
                            s.cardMeta,
                            pressed && s.cardPressedInner,
                          ]}
                        >
                          <Text style={s.cardDate}>{dreamDateLabel(item)}</Text>
                          <View
                            style={[
                              s.statusPill,
                              { backgroundColor: tone.bg, borderColor: tone.border },
                            ]}
                          >
                            <Text style={[s.statusPillText, { color: tone.text }]}>
                              {statusLabel[item.status]}
                            </Text>
                          </View>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Editar sueño"
                          onPress={() => goEdit(item.id)}
                          style={({ pressed }) => [
                            s.editBtn,
                            pressed && { opacity: 0.85 },
                          ]}
                        >
                          <Ionicons name="create-outline" size={20} color={colors.accent} />
                          <Text style={s.editBtnLabel}>Editar</Text>
                        </Pressable>
                      </View>

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => goView(item.id)}
                        style={({ pressed }) => [
                          s.snippetPress,
                          pressed && s.cardPressedInner,
                        ]}
                      >
                        <Text style={s.cardSnippet} numberOfLines={4}>
                          {dreamSnippet(item.rawNarrative)}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        {error && dreams.length > 0 ? (
          <View style={[s.inlineError, { bottom: insets.bottom + spacing.lg + 64 }]}>
            <Text style={s.inlineErrorText} numberOfLines={2}>
              {error}
            </Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nuevo sueño"
          onPress={() => router.push('/dream/new')}
          style={({ pressed }) => [
            s.fab,
            {
              bottom: insets.bottom + spacing.lg,
              right: spacing.xl + insets.right,
            },
            pressed && s.fabPressed,
          ]}
        >
          <Ionicons name="add" size={28} color={colors.textInverse} />
        </Pressable>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(124, 92, 196, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.28)',
  },
  bookBtnLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
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

  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },

  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
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
  retryBtnText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
  },

  listContent: {
    flexGrow: 1,
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  gridRow: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cardCol: {
    marginBottom: spacing.md,
  },

  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cardMediaPress: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 92, 196, 0.08)',
  },
  cardBody: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardPressedInner: {
    opacity: 0.92,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cardMeta: {
    flex: 1,
    gap: spacing.sm,
  },
  cardDate: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(124, 92, 196, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.28)',
  },
  editBtnLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
  },
  snippetPress: {
    alignSelf: 'stretch',
  },
  cardSnippet: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  emptyCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.md,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
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

  inlineError: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(232, 93, 106, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232, 93, 106, 0.35)',
  },
  inlineErrorText: {
    fontSize: typography.sizes.sm,
    color: colors.danger,
    textAlign: 'center',
  },

  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabPressed: { opacity: 0.9 },
});
