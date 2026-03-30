import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
  rows: { id: string; primary: string; secondary?: string }[];
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
  const thumbW = (Math.min(width - spacing.xl * 2, 440) - spacing.sm) / 2;

  const [tab, setTab] = useState<'dream' | 'elements'>('dream');

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

  const when = session.timestamp ?? session.createdAt;
  const dateLine = when ? formatDreamDateTime(when) : 'Sin fecha';

  function goSignal(slug: SignalEntityListSlug, catalogId: string) {
    if (!catalogId) return;
    const returnTo = encodeURIComponent(`/dream/${session.id}`);
    router.push(`/signals/${slug}/${catalogId}?returnTo=${returnTo}`);
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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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

          {session.dreamImages.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Imágenes del sueño</Text>
              <View style={styles.imageGrid}>
                {session.dreamImages.map((uri) => (
                  <View
                    key={uri}
                    style={[styles.thumbWrap, { width: thumbW }]}
                  >
                    <Image
                      source={{ uri }}
                      style={styles.thumb}
                      contentFit="cover"
                      transition={200}
                    />
                  </View>
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
                  <Text style={styles.bodyText}>{dreamPerspectiveLabel(p)}</Text>
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
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
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
                <Text style={styles.sectionTitle}>{sec.title}</Text>
                <View style={styles.entityList}>
                  {sec.rows.map((row) => (
                    <Pressable
                      key={row.id || row.primary}
                      accessibilityRole="button"
                      disabled={!row.id}
                      onPress={() => goSignal(sec.slug, row.id)}
                      style={({ pressed }) => [
                        styles.entityRow,
                        !row.id && styles.entityRowDisabled,
                        pressed && row.id && { opacity: 0.85 },
                      ]}
                    >
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
        </ScrollView>
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
  scrollContent: {
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  thumbWrap: {
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  thumb: {
    ...StyleSheet.absoluteFillObject,
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
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.22)',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    overflow: 'hidden',
  },
  entityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  entityRowDisabled: { opacity: 0.6 },
  entityText: { flex: 1, gap: 4 },
  entityPrimary: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  entitySecondary: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
