import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell } from '@/components/layout/ScreenShell';
import { AsyncState } from '@/components/ui';
import { Image } from 'expo-image';
import { apiErrorMessage } from '@/services/api';
import {
  fetchSignalsCatalogEntity,
  mapSignalsCatalogEntityToDetail,
} from '@/lib/signalsCatalogEntity';
import { queryKeys } from '@/lib/queryKeys';
import { SIGNAL_ENTITY_SECTIONS, type SignalEntityListSlug } from '@/services/signalEntities';
import { colors, radius, spacing, typography } from '@/theme';
import { safeDreamReturnToHref } from '@/utils/safeDreamReturnToHref';

/** Lado máximo del cuadrado (px): evita imagen “alargada” en pantallas anchas. */
const DETAIL_IMAGE_MAX_SIDE = 260;

const DETAIL_HEADER_ES: Record<SignalEntityListSlug, string> = {
  characters: 'Personaje',
  locations: 'Lugar',
  objects: 'Objeto',
  events: 'Evento',
  'life-context': 'Contexto',
  feelings: 'Sentimiento',
};

function isSignalSlug(s: string): s is SignalEntityListSlug {
  return SIGNAL_ENTITY_SECTIONS.some((x) => x.listSlug === s);
}

function formatDreamWhen(ts: string | null): string {
  if (!ts) return 'Sin fecha';
  try {
    return new Intl.DateTimeFormat('es', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(ts));
  } catch {
    return 'Sin fecha';
  }
}

/** /signals/:entity/:id — catalog item detail. */
export default function SignalsCatalogDetailScreen() {
  const { entity, id, returnTo } = useLocalSearchParams<{
    entity: string;
    id: string;
    returnTo?: string;
  }>();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();

  /** Cuadrado: ~70 % del ancho útil, con tope en px. */
  const imageSidePx = useMemo(() => {
    const rowInner = Math.max(0, windowWidth - spacing.xl * 2);
    const side = Math.floor(rowInner * 0.7);
    return Math.min(Math.max(side, 1), DETAIL_IMAGE_MAX_SIDE);
  }, [windowWidth]);

  const slug = (entity ?? '').toLowerCase();
  const rawId = (id ?? '').trim();
  const slugOk = isSignalSlug(slug) && !!rawId;

  const detailQuery = useQuery({
    queryKey: queryKeys.signals.catalogDetail(
      slug as SignalEntityListSlug,
      rawId,
    ),
    queryFn: () =>
      fetchSignalsCatalogEntity(slug as SignalEntityListSlug, rawId),
    enabled: slugOk,
  });

  const view =
    detailQuery.data != null
      ? mapSignalsCatalogEntityToDetail(detailQuery.data)
      : null;

  const err =
    !slugOk
      ? 'Invalid link'
      : detailQuery.error
        ? apiErrorMessage(detailQuery.error)
        : null;

  const headerTitle =
    slugOk && isSignalSlug(slug)
      ? DETAIL_HEADER_ES[slug]
      : 'Detalle';

  const dreamReturnHref = useMemo(
    () => safeDreamReturnToHref(returnTo),
    [returnTo],
  );

  const editHref = useMemo(() => {
    const base = `/signals/${slug}/${rawId}/edit`;
    if (!dreamReturnHref) return base;
    return `${base}?returnTo=${encodeURIComponent(dreamReturnHref)}`;
  }, [slug, rawId, dreamReturnHref]);

  function handleBack() {
    if (dreamReturnHref) {
      router.push(dreamReturnHref as Href);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(slugOk ? `/signals/${slug}` : '/signals');
  }

  return (
    <ScreenShell style={{ paddingHorizontal: spacing.xl }}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => handleBack()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.screenTitle} numberOfLines={1}>
            {headerTitle}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit"
            onPress={() => router.push(editHref as Href)}
            style={({ pressed }) => [styles.editIcon, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="create-outline" size={22} color={colors.accent} />
          </Pressable>
        </View>

        <AsyncState
          loading={detailQuery.isPending && slugOk}
          error={err}
          onRetry={() => void detailQuery.refetch()}
        />
        {!detailQuery.isPending && !err && view && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.blockImage}>
              <View
                style={[
                  styles.squareFrame,
                  {
                    width: imageSidePx,
                    height: imageSidePx,
                  },
                ]}
              >
                {view.imageUri ? (
                  <Image
                    source={{ uri: view.imageUri }}
                    style={styles.squareImage}
                    contentFit="cover"
                    contentPosition="center"
                  />
                ) : (
                  <View style={styles.squarePlaceholder}>
                    <Ionicons
                      name="image-outline"
                      size={40}
                      color={colors.accentMuted}
                    />
                  </View>
                )}
              </View>
            </View>
            <View style={styles.blockData}>
              <Text style={styles.title}>{view.title}</Text>
              {view.subtitle ? (
                <Text style={styles.desc}>{view.subtitle}</Text>
              ) : null}
              <Text style={styles.sectionLabel}>Apariciones en sueños</Text>
              {view.dreamSessions.length === 0 ? (
                <Text style={styles.metaEmpty}>Ninguna aún</Text>
              ) : (
                <View style={styles.dreamList}>
                  {view.dreamSessions.map((ds) => (
                    <Pressable
                      key={ds.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Abrir sueño del ${formatDreamWhen(ds.timestamp)}`}
                      onPress={() => router.push(`/dream/${ds.id}`)}
                      style={({ pressed }) => [
                        styles.dreamRow,
                        pressed && styles.dreamRowPressed,
                      ]}
                    >
                      <Ionicons
                        name="moon-outline"
                        size={20}
                        color={colors.accent}
                      />
                      <Text style={styles.dreamRowLabel} numberOfLines={2}>
                        {formatDreamWhen(ds.timestamp)}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
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
  editIcon: {
    width: 40,
    alignItems: 'flex-end',
    paddingVertical: spacing.xs,
  },
  screenTitle: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
    gap: spacing.xl,
  },
  blockImage: {
    width: '100%',
    alignItems: 'center',
  },
  blockData: {
    width: '100%',
    gap: spacing.md,
  },
  /** Lado en px vía `imageSidePx` (máx. DETAIL_IMAGE_MAX_SIDE). */
  squareFrame: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.28)',
  },
  squareImage: {
    width: '100%',
    height: '100%',
  },
  squarePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  desc: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  metaEmpty: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  dreamList: {
    gap: spacing.sm,
  },
  dreamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.22)',
  },
  dreamRowPressed: {
    opacity: 0.88,
  },
  dreamRowLabel: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  err: {
    marginTop: spacing.lg,
    color: colors.danger,
    fontSize: typography.sizes.sm,
  },
});
