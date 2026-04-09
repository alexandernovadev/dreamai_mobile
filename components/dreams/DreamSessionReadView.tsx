import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';
import { Chip } from '@/components/ui/Chip';
import {
  DREAM_KIND_OPTIONS,
  dreamPerspectiveLabel,
  FEELING_KIND_OPTIONS,
  type DreamSession,
  type DreamSessionHydratedMaps,
  type DreamSessionStatus,
} from '@/services';
import type { SignalEntityListSlug } from '@/services/signalEntities';
import { entityRefId } from '@/utils/entityRef';
import { colors, radius, spacing, typography } from '@/theme';

const STATUS_LABEL: Record<DreamSessionStatus, string> = {
  DRAFT: 'Borrador',
  ELEMENTS: 'Elementos',
  STRUCTURED: 'Detalle',
  THOUGHT: 'Reflexión',
};

const STATUS_TONE: Record<
  DreamSessionStatus,
  { bg: string; border: string; text: string }
> = {
  DRAFT: {
    bg: 'rgba(124, 92, 196, 0.14)',
    border: 'rgba(124, 92, 196, 0.35)',
    text: '#c4b0f0',
  },
  ELEMENTS: {
    bg: 'rgba(80, 168, 255, 0.14)',
    border: 'rgba(80, 168, 255, 0.35)',
    text: '#8cc8ff',
  },
  STRUCTURED: {
    bg: 'rgba(64, 240, 160, 0.12)',
    border: 'rgba(64, 240, 160, 0.35)',
    text: '#80f0b8',
  },
  THOUGHT: {
    bg: 'rgba(240, 200, 96, 0.14)',
    border: 'rgba(240, 200, 96, 0.35)',
    text: '#f0d890',
  },
};

const KIND_VARIANTS = [
  'purple',
  'blue',
  'teal',
  'green',
  'orange',
  'rose',
] as const;

const ENTITY_ICON: Record<SignalEntityListSlug, keyof typeof Ionicons.glyphMap> = {
  characters: 'person-outline',
  locations: 'location-outline',
  objects: 'cube-outline',
  events: 'flash-outline',
  'life-context': 'globe-outline',
  feelings: 'heart-outline',
};

const ENTITY_ACCENT: Record<
  SignalEntityListSlug,
  { color: string; bg: string; border: string }
> = {
  characters: {
    color: '#d8b4ff',
    bg: 'rgba(172, 111, 255, 0.14)',
    border: 'rgba(172, 111, 255, 0.28)',
  },
  locations: {
    color: '#8fd1ff',
    bg: 'rgba(80, 168, 255, 0.14)',
    border: 'rgba(80, 168, 255, 0.28)',
  },
  objects: {
    color: '#7ee7c8',
    bg: 'rgba(64, 240, 160, 0.12)',
    border: 'rgba(64, 240, 160, 0.28)',
  },
  events: {
    color: '#ffd58a',
    bg: 'rgba(255, 196, 92, 0.14)',
    border: 'rgba(255, 196, 92, 0.28)',
  },
  'life-context': {
    color: '#f6a6d7',
    bg: 'rgba(236, 120, 184, 0.14)',
    border: 'rgba(236, 120, 184, 0.28)',
  },
  feelings: {
    color: '#ff9ea1',
    bg: 'rgba(255, 118, 118, 0.14)',
    border: 'rgba(255, 118, 118, 0.28)',
  },
};

function formatDreamDateTime(d: Date): string {
  return new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function formatMetaDate(d: Date): string {
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function dreamKindLabel(value: string): string {
  return DREAM_KIND_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function feelingKindLabel(kind: string): string {
  return FEELING_KIND_OPTIONS.find((o) => o.value === kind)?.label ?? kind;
}

type EntitySectionDef = {
  title: string;
  slug: SignalEntityListSlug;
  rows: { id: string; primary: string; secondary?: string; imageUri?: string }[];
};

export type DreamSessionReadViewProps = {
  session: DreamSession;
  hydrated: DreamSessionHydratedMaps;
};

export function DreamSessionReadView({
  session,
  hydrated,
}: DreamSessionReadViewProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollOffset(scrollRef);
  const heroHeight = Math.max(280, Math.min(width * 0.92, 420));
  const entityGridWidth = Math.max(width - spacing.sm * 2, 0);
  const entityColumns = Math.max(1, Math.min(5, Math.floor(entityGridWidth / 140)));
  const entityCardWidth =
    entityColumns > 1
      ? Math.max(
          (entityGridWidth - spacing.sm * Math.max(entityColumns - 1, 0)) /
            entityColumns,
          0
        )
      : undefined;

  const [tab, setTab] = useState<'dream' | 'elements'>('dream');
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  const entitySections = useMemo((): EntitySectionDef[] => {
    const ent = session.analysis?.entities;
    const out: EntitySectionDef[] = [];

    if (ent?.characters?.length) {
      const rows = ent.characters.map((r) => {
        const id = entityRefId(r.characterId) ?? '';
        const row = id ? hydrated.characters[id] : undefined;
        return {
          id,
          primary: row?.name?.trim() || 'Personaje',
          secondary: row?.description?.trim(),
          imageUri: row?.imageUri,
        };
      });
      out.push({ title: 'Personajes', slug: 'characters', rows });
    }

    if (ent?.locations?.length) {
      const rows = ent.locations.map((r) => {
        const id = entityRefId(r.locationId) ?? '';
        const row = id ? hydrated.locations[id] : undefined;
        return {
          id,
          primary: row?.name?.trim() || 'Lugar',
          secondary: row?.description?.trim(),
          imageUri: row?.imageUri,
        };
      });
      out.push({ title: 'Lugares', slug: 'locations', rows });
    }

    if (ent?.objects?.length) {
      const rows = ent.objects.map((r) => {
        const id = entityRefId(r.objectId) ?? '';
        const row = id ? hydrated.objects[id] : undefined;
        return {
          id,
          primary: row?.name?.trim() || 'Objeto',
          secondary: row?.description?.trim(),
          imageUri: row?.imageUri,
        };
      });
      out.push({ title: 'Objetos', slug: 'objects', rows });
    }

    if (ent?.events?.length) {
      const rows = ent.events.map((r) => {
        const id = entityRefId(r.eventId) ?? '';
        const row = id ? hydrated.events[id] : undefined;
        return {
          id,
          primary: row?.label?.trim() || 'Evento',
          secondary: row?.description?.trim(),
        };
      });
      out.push({ title: 'Eventos', slug: 'events', rows });
    }

    if (ent?.contextLife?.length) {
      const rows = ent.contextLife.map((r) => {
        const id = entityRefId(r.contextLifeId) ?? '';
        const row = id ? hydrated.contextLife[id] : undefined;
        return {
          id,
          primary: row?.title?.trim() || 'Contexto',
          secondary: row?.description?.trim(),
        };
      });
      out.push({ title: 'Contexto de vida', slug: 'life-context', rows });
    }

    if (ent?.feelings?.length) {
      const rows = ent.feelings.map((r) => {
        const id = entityRefId(r.feelingId) ?? '';
        const row = id ? hydrated.feelings[id] : undefined;
        const kindLabel = row?.kind
          ? feelingKindLabel(row.kind)
          : 'Sentimiento';
        const extra =
          row?.intensity != null ? `Intensidad ${row.intensity}/10` : undefined;
        const notes = row?.notes?.trim();
        const secondary = [extra, notes].filter(Boolean).join(' · ') || undefined;
        return {
          id,
          primary: kindLabel,
          secondary,
        };
      });
      out.push({ title: 'Emociones', slug: 'feelings', rows });
    }

    return out;
  }, [session.analysis?.entities, hydrated]);

  const hasAnyEntity = entitySections.some((s) => s.rows.length > 0);

  const perspectives = session.analysis?.perspectives?.filter(Boolean) ?? [];
  const lucidity = session.analysis?.lucidityLevel;
  const heroImageUri = session.dreamImages[heroImageIndex] ?? null;
  const hasMultipleImages = session.dreamImages.length > 1;

  const when = session.timestamp ?? session.createdAt;
  const dateLine = when ? formatDreamDateTime(when) : 'Sin fecha';

  useEffect(() => {
    setHeroImageIndex(0);
  }, [session.id, session.dreamImages.length]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollOffset.value,
          [-heroHeight, 0, heroHeight],
          [-heroHeight / 2, 0, heroHeight * 0.7]
        ),
      },
      {
        scale: interpolate(
          scrollOffset.value,
          [-heroHeight, 0, heroHeight],
          [1.8, 1, 1]
        ),
      },
    ],
  }));

  function goSignal(slug: SignalEntityListSlug, catalogId: string) {
    if (!catalogId) return;
    const returnTo = encodeURIComponent(`/dream/${session.id}`);
    router.push(`/signals/${slug}/${catalogId}?returnTo=${returnTo}`);
  }

  function goPrevHeroImage() {
    if (!session.dreamImages.length) return;
    setHeroImageIndex((current) =>
      current === 0 ? session.dreamImages.length - 1 : current - 1
    );
  }

  function goNextHeroImage() {
    if (!session.dreamImages.length) return;
    setHeroImageIndex((current) =>
      current === session.dreamImages.length - 1 ? 0 : current + 1
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.tabRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: tab === 'dream' }}
          onPress={() => setTab('dream')}
          style={({ pressed }) => [
            styles.tabBtn,
            tab === 'dream' ? styles.tabBtnOn : styles.tabBtnOff,
            pressed && { opacity: 0.88 },
          ]}
        >
          <Ionicons
            name="book-outline"
            size={18}
            color={tab === 'dream' ? colors.text : colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              tab === 'dream' ? styles.tabLabelOn : styles.tabLabelOff,
            ]}
          >
            Sueño
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: tab === 'elements' }}
          onPress={() => setTab('elements')}
          style={({ pressed }) => [
            styles.tabBtn,
            tab === 'elements' ? styles.tabBtnOn : styles.tabBtnOff,
            pressed && { opacity: 0.88 },
          ]}
        >
          <Ionicons
            name="pricetags-outline"
            size={18}
            color={tab === 'elements' ? colors.text : colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              tab === 'elements' ? styles.tabLabelOn : styles.tabLabelOff,
            ]}
          >
            Elementos
          </Text>
        </Pressable>
      </View>

      {tab === 'dream' ? (
        <Animated.ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.dreamScrollContent}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.parallaxHeader,
              { height: heroHeight },
              headerAnimatedStyle,
            ]}
          >
            {heroImageUri ? (
              <>
                <Image
                  source={{ uri: heroImageUri }}
                  style={styles.heroBackdrop}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.heroShade} />
                <View style={styles.heroForeground}>
                  <Image
                    source={{ uri: heroImageUri }}
                    style={styles.heroImage}
                    contentFit="contain"
                    transition={200}
                  />
                </View>
                {hasMultipleImages ? (
                  <View style={styles.heroCarouselControls}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Imagen anterior"
                      onPress={goPrevHeroImage}
                      style={({ pressed }) => [
                        styles.heroNavBtn,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <Ionicons name="chevron-back" size={18} color={colors.text} />
                    </Pressable>

                    <View style={styles.heroCarouselMeta}>
                      <Text style={styles.heroCarouselCount}>
                        {heroImageIndex + 1} / {session.dreamImages.length}
                      </Text>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Imagen siguiente"
                      onPress={goNextHeroImage}
                      style={({ pressed }) => [
                        styles.heroNavBtn,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.text}
                      />
                    </Pressable>
                  </View>
                ) : null}
              </>
            ) : (
              <View style={styles.heroEmpty}>
                <Ionicons
                  name="image-outline"
                  size={48}
                  color={colors.textMuted}
                />
                <Text style={styles.heroEmptyText}>Sin imagen del sueño</Text>
              </View>
            )}
          </Animated.View>

          <View style={styles.dreamCard}>
            <View style={styles.hero}>
              <Text style={styles.dateLine}>{dateLine}</Text>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: STATUS_TONE[session.status].bg,
                    borderColor: STATUS_TONE[session.status].border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: STATUS_TONE[session.status].text },
                  ]}
                >
                  {STATUS_LABEL[session.status]}
                </Text>
              </View>
            </View>

            {session.rawNarrative.trim().length > 0 ? (
              <Text style={styles.narrative}>{session.rawNarrative.trim()}</Text>
            ) : (
              <Text style={styles.mutedBlock}>Sin narrativa registrada.</Text>
            )}

            {session.dreamKind.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tipo</Text>
                <View style={styles.chipRow}>
                  {session.dreamKind.map((k, idx) => (
                    <Chip
                      key={k}
                      label={dreamKindLabel(k)}
                      variant={KIND_VARIANTS[idx % KIND_VARIANTS.length]}
                      selected
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {session.userThought?.trim() ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tu reflexión</Text>
                <Text style={styles.bodyText}>{session.userThought.trim()}</Text>
              </View>
            ) : null}

            {session.aiSummarize?.trim() ? (
              <View style={[styles.section, styles.aiCard]}>
                <View style={styles.aiCardHead}>
                  <Ionicons name="sparkles" size={18} color={colors.accent} />
                  <Text style={styles.aiCardTitle}>Lectura DreamAI</Text>
                </View>
                <Text style={styles.bodyText}>{session.aiSummarize.trim()}</Text>
              </View>
            ) : null}

            {lucidity != null && lucidity >= 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Lucidez</Text>
                <Text style={styles.lucidityLabel}>
                  {lucidity} / 10
                </Text>
                <View style={styles.lucidityTrack}>
                  <View
                    style={[
                      styles.lucidityFill,
                      { width: `${Math.min(100, (lucidity / 10) * 100)}%` },
                    ]}
                  />
                </View>
              </View>
            ) : null}

            {perspectives.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Perspectivas</Text>
                {perspectives.map((p, i) => (
                  <View key={`${i}-${p.slice(0, 24)}`} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bodyText}>
                      {dreamPerspectiveLabel(p)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.metaFoot}>
              {session.createdAt ? (
                <Text style={styles.metaText}>
                  Registrado {formatMetaDate(session.createdAt)}
                </Text>
              ) : null}
              {session.updatedAt &&
              session.createdAt &&
              session.updatedAt.getTime() !== session.createdAt.getTime() ? (
                <Text style={styles.metaText}>
                  Actualizado {formatMetaDate(session.updatedAt)}
                </Text>
              ) : null}
            </View>
          </View>
        </Animated.ScrollView>
      ) : (
        <Animated.ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.elementsScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!hasAnyEntity ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="link-outline"
                size={40}
                color={colors.textMuted}
              />
              <Text style={styles.emptyTitle}>Sin elementos vinculados</Text>
              <Text style={styles.emptyHint}>
                Las entidades del catálogo (personajes, lugares, etc.) aparecen
                aquí cuando las asocies en el editor del sueño.
              </Text>
            </View>
          ) : (
            entitySections.map((sec) => (
              <View key={sec.slug} style={styles.section}>
                <View
                  style={[
                    styles.entitySectionBadge,
                    {
                      backgroundColor: ENTITY_ACCENT[sec.slug].bg,
                      borderColor: ENTITY_ACCENT[sec.slug].border,
                    },
                  ]}
                >
                  <Ionicons
                    name={ENTITY_ICON[sec.slug]}
                    size={16}
                    color={ENTITY_ACCENT[sec.slug].color}
                  />
                  <Text
                    style={[
                      styles.entitySectionTitle,
                      { color: ENTITY_ACCENT[sec.slug].color },
                    ]}
                  >
                    {sec.title}
                  </Text>
                </View>
                <View style={styles.entityList}>
                  {sec.rows.map((row) => (
                    <Pressable
                      key={row.id || row.primary}
                      accessibilityRole="button"
                      disabled={!row.id}
                      onPress={() => goSignal(sec.slug, row.id)}
                      style={({ pressed }) => [
                        styles.entityRow,
                        entityCardWidth != null && { width: entityCardWidth },
                        !row.id && styles.entityRowDisabled,
                        pressed && row.id && { opacity: 0.85 },
                      ]}
                    >
                      <View style={styles.entityMedia}>
                        {row.imageUri ? (
                          <Image
                            source={{ uri: row.imageUri }}
                            style={styles.entityImage}
                            contentFit="cover"
                            transition={200}
                          />
                        ) : (
                          <View style={styles.entityImagePlaceholder}>
                            <Ionicons
                              name={ENTITY_ICON[sec.slug]}
                              size={22}
                              color={colors.accentMuted}
                            />
                          </View>
                        )}
                      </View>
                      <View style={styles.entityText}>
                        <Text style={styles.entityPrimary} numberOfLines={2}>
                          {row.primary}
                        </Text>
                        {row.secondary ? (
                          <Text
                            style={styles.entitySecondary}
                            numberOfLines={2}
                          >
                            {row.secondary}
                          </Text>
                        ) : null}
                      </View>
                      {row.id ? (
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={colors.textMuted}
                        />
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              </View>
            ))
          )}
        </Animated.ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  tabBtnOn: {
    borderColor: 'rgba(124, 92, 196, 0.45)',
    backgroundColor: 'rgba(124, 92, 196, 0.2)',
  },
  tabBtnOff: {
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  tabLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  tabLabelOn: { color: colors.text },
  tabLabelOff: { color: colors.textMuted },
  scroll: { flex: 1 },
  dreamScrollContent: {
    paddingBottom: spacing.xxxl,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  elementsScrollContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  parallaxHeader: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroBackdrop: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.34,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 8, 18, 0.42)',
  },
  heroForeground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  heroCarouselControls: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heroNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.42)',
    backgroundColor: 'rgba(124, 92, 196, 0.28)',
  },
  heroCarouselMeta: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(7, 8, 18, 0.55)',
  },
  heroCarouselCount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  heroEmptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  dreamCard: {
    marginTop: -spacing.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.18)',
    backgroundColor: 'rgba(8, 10, 18, 0.88)',
  },
  hero: { gap: spacing.sm },
  dateLine: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textTransform: 'capitalize',
    lineHeight: 26,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  narrative: {
    fontSize: typography.sizes.md,
    lineHeight: 26,
    color: colors.textSecondary,
  },
  mutedBlock: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  entitySectionBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  entitySectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  bodyText: {
    fontSize: typography.sizes.md,
    lineHeight: 24,
    color: colors.textSecondary,
    flex: 1,
  },
  aiCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.28)',
    backgroundColor: 'rgba(124, 92, 196, 0.08)',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  aiCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  aiCardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  lucidityLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  lucidityTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  lucidityFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bullet: {
    fontSize: typography.sizes.md,
    color: colors.accent,
    marginTop: 2,
  },
  metaFoot: {
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  metaText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  entityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  entityRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.22)',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    padding: spacing.sm,
  },
  entityRowDisabled: { opacity: 0.6 },
  entityMedia: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  entityImage: {
    width: '100%',
    height: '100%',
  },
  entityImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entityText: { flex: 1, gap: 4 },
  entityPrimary: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  entitySecondary: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
