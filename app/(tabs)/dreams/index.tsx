import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { colors, gradients, spacing, radius, typography } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Chip, type ChipVariant } from '@/components/ui/Chip';
import { Modal } from '@/components/ui/Modal';
import { dreamSessionsService } from '@/services';
import { effectiveDreamDate } from '@/lib/dreamDate';
import { DreamSessionStatus, DreamKind, type DreamSession } from '@/lib/docs/types/dream';

const STATUS_LABEL: Record<DreamSessionStatus, string> = {
  DRAFT: 'Borrador',
  REFINING: 'Refinando',
  STRUCTURED: 'Estructurado',
  REFLECTIONS_DONE: 'Reflexionado',
};

const STATUS_CHIP: Record<DreamSessionStatus, ChipVariant> = {
  DRAFT: 'neutral',
  REFINING: 'yellow',
  STRUCTURED: 'blue',
  REFLECTIONS_DONE: 'green',
};

const STATUS_ICON: Record<DreamSessionStatus, keyof typeof Ionicons.glyphMap> = {
  DRAFT: 'document-text-outline',
  REFINING: 'color-wand-outline',
  STRUCTURED: 'grid-outline',
  REFLECTIONS_DONE: 'checkmark-circle-outline',
};

function formatDate(d: Date): string {
  return d.toLocaleDateString('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function previewText(s: DreamSession): string {
  const raw =
    s.rawNarrative ?? s.dreams?.[0]?.rawText ?? '';
  return raw.length > 90 ? raw.slice(0, 90) + '…' : raw || 'Sin texto';
}

export default function DreamsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bg = gradients.background;

  const [sessions, setSessions] = useState<DreamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /** Bumped after a successful delete (or when starting a new load) so stale in-flight GETs cannot overwrite state. */
  const listLoadGenRef = useRef(0);

  const load = useCallback(async () => {
    const gen = ++listLoadGenRef.current;
    try {
      setLoading(true);
      const data = await dreamSessionsService.list();
      if (gen !== listLoadGenRef.current) return;
      data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setSessions(data);
    } catch (e) {
      if (gen !== listLoadGenRef.current) return;
      console.warn('Failed to load sessions', e);
    } finally {
      if (gen === listLoadGenRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    try {
      const created = await dreamSessionsService.create({
        timestamp: new Date(),
        status: DreamSessionStatus.Draft,
        dreamKind: [DreamKind.Unknown],
        rawNarrative: '',
        dreams: [{ id: `seg-${Date.now()}`, order: 0, rawText: '' }],
      });
      router.push({
        pathname: '/dreams/[id]',
        params: { id: created.id, mode: 'edit' },
      });
    } catch (e) {
      console.warn('Failed to create dream', e);
    } finally {
      setCreating(false);
    }
  }

  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    if (!removeId) return;
    const idToRemove = removeId;
    setRemoving(true);
    try {
      await dreamSessionsService.remove(idToRemove);
      listLoadGenRef.current += 1;
      setSessions((prev) => prev.filter((s) => s.id !== idToRemove));
      setRemoveId(null);
    } catch (e) {
      console.warn('Failed to remove session', e);
    } finally {
      setRemoving(false);
    }
  }

  function renderItem({ item }: { item: DreamSession }) {
    const statusKey = item.status as DreamSessionStatus;
    return (
      <View style={styles.card}>
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={styles.cardDateRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.cardDate}>{formatDate(effectiveDreamDate(item))}</Text>
            </View>
            <Chip label={STATUS_LABEL[statusKey]} variant={STATUS_CHIP[statusKey]} icon={STATUS_ICON[statusKey]} />
          </View>
          <Text style={styles.cardPreview} numberOfLines={2}>
            {previewText(item)}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Leer"
            hitSlop={8}
            onPress={() => router.push({ pathname: '/dreams/[id]', params: { id: item.id, mode: 'read' } })}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}
          >
            <Ionicons name="eye-outline" size={22} color={colors.accent} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Editar"
            hitSlop={8}
            onPress={() => router.push({ pathname: '/dreams/[id]', params: { id: item.id, mode: 'edit' } })}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}
          >
            <Ionicons name="create-outline" size={22} color={colors.accent} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Eliminar"
            hitSlop={8}
            onPress={() => setRemoveId(item.id)}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}
          >
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
          </Pressable>
        </View>
      </View>
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
        <Text style={styles.title}>Sueños</Text>
        <View style={styles.subtitleRow}>
          <Ionicons name="moon" size={14} color={colors.textMuted} />
          <Text style={styles.subtitle}>Tu diario onírico</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : (
          <FlatList
            data={sessions}
            extraData={sessions}
            keyExtractor={(s) => s.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
                progressBackgroundColor={colors.surface}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="moon-outline" size={48} color={colors.accentMuted} />
                <Text style={styles.emptyTitle}>Aún no hay sueños</Text>
                <Text style={styles.emptyHint}>
                  Pulsa + para capturar tu primer sueño.
                </Text>
              </View>
            }
          />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nuevo sueño"
          onPress={handleCreate}
          style={({ pressed }) => [
            styles.fab,
            {
              bottom: insets.bottom + spacing.lg,
              right: spacing.xl + insets.right,
            },
            pressed && styles.fabPressed,
          ]}
        >
          <Ionicons name="add" size={28} color={colors.textInverse} />
        </Pressable>
      </View>

      {/* ── Confirm delete modal ── */}
      <Modal
        visible={removeId !== null}
        onClose={() => setRemoveId(null)}
        title="Eliminar sueño"
        closeLabel="Cancelar"
      >
        <View style={styles.deleteModalBody}>
          <Ionicons name="warning-outline" size={40} color={colors.danger} />
          <Text style={styles.deleteMessage}>
            ¿Estás seguro de que quieres eliminar este sueño? Esta acción no se puede deshacer.
          </Text>
        </View>
        <Button variant="rose" onPress={handleRemove} disabled={removing}>
          {removing ? 'Eliminando…' : 'Sí, eliminar'}
        </Button>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.huge + 56,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardBody: { marginBottom: spacing.sm },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardDate: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  cardPreview: {
    fontSize: typography.sizes.md,
    color: colors.text,
    lineHeight: 22,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.lg,
  },
  iconBtn: {
    padding: spacing.xs,
  },
  iconPressed: { opacity: 0.5 },

  empty: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  emptyHint: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
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
  },
  fabPressed: { opacity: 0.9 },

  // Delete modal
  deleteModalBody: {
    alignItems: 'center',
    gap: spacing.md,
  },
  deleteMessage: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  deleteBtn: {
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  deleteBtnLabel: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
