import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radius, spacing, typography } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { KeyboardAvoidingScroll } from '@/components/ui/KeyboardAvoidingScroll';
import { dreamSessionsService, lifeEventsService } from '@/services';
import { Chip } from '@/components/ui/Chip';
import { TabRefining } from '@/components/dreams/TabRefining';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import {
  DreamKind,
  DreamSessionStatus,
  Perspective,
  type DreamSession,
} from '@/lib/docs/types/dream';
import type { LifeEvent } from '@/lib/docs/types/life-event';

// ────────────────────────────────────────
// Tab definitions
// ────────────────────────────────────────
const TABS = ['Draft', 'Refining', 'Structured', 'Reflection'] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, string> = {
  Draft: '1. Borrador',
  Refining: '2. Refinar',
  Structured: '3. Estructura',
  Reflection: '4. Reflexión',
};

const STATUS_LABEL: Record<DreamSessionStatus, string> = {
  DRAFT: 'Borrador',
  REFINING: 'Refinando',
  STRUCTURED: 'Estructurado',
  REFLECTIONS_DONE: 'Reflexionado',
};

const STATUS_COLOR: Record<DreamSessionStatus, string> = {
  DRAFT: colors.textMuted,
  REFINING: colors.warning,
  STRUCTURED: colors.info,
  REFLECTIONS_DONE: colors.success,
};

function statusToTab(status: DreamSessionStatus): Tab {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'REFINING':
      return 'Refining';
    case 'STRUCTURED':
      return 'Structured';
    case 'REFLECTIONS_DONE':
      return 'Reflection';
    default:
      return 'Draft';
  }
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ────────────────────────────────────────
// Tab content components
// ────────────────────────────────────────

type TabProps = {
  session: DreamSession;
  editing: boolean;
  onSessionChange: (updated: DreamSession) => void;
};

function TabDraft({ session, editing, onSessionChange }: TabProps) {
  const initial = session.rawNarrative ?? session.dreams?.[0]?.rawText ?? '';
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = text.trim() !== initial.trim();

  async function handleSave() {
    const trimmed = text.trim();
    if (!trimmed || !dirty) return;
    setSaving(true);
    try {
      const updated = await dreamSessionsService.update(session.id, {
        rawNarrative: trimmed,
        dreams: [
          {
            ...(session.dreams[0] ?? { id: `seg-${Date.now()}`, order: 0 }),
            rawText: trimmed,
          },
        ],
      });
      onSessionChange(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      console.warn('Failed to save draft', e);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <ScrollView contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.dreamText}>{initial || 'Sin texto'}</Text>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
    >
      <TextInput
        style={styles.fullTextarea}
        value={text}
        onChangeText={(v) => {
          setText(v);
          setSaved(false);
        }}
        placeholder="Anoche soñé que…"
        placeholderTextColor={colors.textMuted}
        multiline
        textAlignVertical="top"
        autoFocus={!initial}
      />

      <View style={styles.draftFooter}>
        {saved && (
          <View style={styles.savedRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.savedLabel}>Guardado</Text>
          </View>
        )}
        <Button variant="purple" onPress={handleSave} disabled={saving || !dirty}>
          {saving ? 'Guardando…' : 'Guardar borrador'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

function TabRefiningWrapper(props: TabProps) {
  return <TabRefining session={props.session} editing={props.editing} onSessionChange={props.onSessionChange} />;
}

const DREAM_KIND_OPTIONS = [
  { value: 'NIGHTMARE', label: 'Pesadilla' },
  { value: 'ORDINARY', label: 'Ordinario' },
  { value: 'FANTASY', label: 'Fantasía' },
  { value: 'LUCID', label: 'Lúcido' },
  { value: 'ANXIOUS', label: 'Ansioso' },
  { value: 'SURREAL', label: 'Surrealista' },
  { value: 'RECURRENT', label: 'Recurrente' },
  { value: 'MIXED', label: 'Mixto' },
  { value: 'UNKNOWN', label: 'Sin clasificar' },
];

const PERSPECTIVE_OPTIONS = [
  { value: 'ACTOR', label: 'Actor (primera persona)' },
  { value: 'OBSERVER', label: 'Observador (tercera persona)' },
];

function TabStructured({ session, editing, onSessionChange }: TabProps) {
  const analysis = session.dreams?.[0]?.analysis;

  const [dreamKind, setDreamKind] = useState(session.dreamKind ?? DreamKind.Unknown);
  const [perspective, setPerspective] = useState<string>(
    analysis?.perspective ?? Perspective.Actor,
  );
  const [isLucid, setIsLucid] = useState(analysis?.isLucid ?? false);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(
    session.relatedLifeEventIds ?? [],
  );
  const [allEvents, setAllEvents] = useState<LifeEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventNote, setNewEventNote] = useState('');
  const [creatingEvent, setCreatingEvent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingEvents(true);
      try {
        const data = await lifeEventsService.list();
        if (!cancelled) setAllEvents(data);
      } catch (e) {
        console.warn('Failed to load life events', e);
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const kindLabel = DREAM_KIND_OPTIONS.find((o) => o.value === dreamKind)?.label ?? dreamKind;
  const perspLabel = PERSPECTIVE_OPTIONS.find((o) => o.value === perspective)?.label ?? perspective;

  function toggleEvent(id: string) {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
    setSaved(false);
  }

  function openAddEvent() {
    setNewEventTitle('');
    setNewEventNote('');
    setShowAddEvent(true);
  }

  async function handleCreateEvent() {
    const title = newEventTitle.trim();
    if (!title) return;
    setCreatingEvent(true);
    try {
      const created = await lifeEventsService.create({
        title,
        note: newEventNote.trim() || undefined,
      });
      setAllEvents((prev) => [...prev, created]);
      setSelectedEventIds((prev) => [...prev, created.id]);
      setSaved(false);
      setShowAddEvent(false);
    } catch (e) {
      console.warn('Failed to create life event', e);
    } finally {
      setCreatingEvent(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const seg = session.dreams?.[0];
      const updatedAnalysis = seg?.analysis
        ? { ...seg.analysis, perspective: perspective as Perspective, isLucid }
        : {
            perspective: perspective as Perspective,
            entities: { characters: [], locations: [], objects: [], feelings: [] },
            isLucid,
          };

      const updated = await dreamSessionsService.update(session.id, {
        status: DreamSessionStatus.Structured,
        dreamKind: dreamKind as DreamKind,
        relatedLifeEventIds: selectedEventIds.length > 0 ? selectedEventIds : undefined,
        dreams: seg
          ? [{ ...seg, analysis: updatedAnalysis }]
          : session.dreams,
      });
      onSessionChange(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      console.warn('Failed to save structured', e);
    } finally {
      setSaving(false);
    }
  }

  const selectedEventNames = selectedEventIds
    .map((id) => allEvents.find((e) => e.id === id))
    .filter(Boolean) as LifeEvent[];

  if (!editing) {
    return (
      <ScrollView contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Tipo de sueño</Text>
          <Text style={styles.fieldValue}>{kindLabel}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Perspectiva</Text>
          <Text style={styles.fieldValue}>{perspLabel}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>¿Lúcido?</Text>
          <Text style={styles.fieldValue}>{isLucid ? 'Sí' : 'No'}</Text>
        </View>
        {selectedEventNames.length > 0 && (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Eventos de vida</Text>
            <View style={styles.chipWrap}>
              {selectedEventNames.map((ev) => (
                <Chip key={ev.id} label={ev.title} variant="teal" icon="calendar" />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
      <Select
        label="Tipo de sueño"
        options={DREAM_KIND_OPTIONS}
        value={dreamKind}
        onValueChange={(v) => { setDreamKind(v as DreamKind); setSaved(false); }}
        modalTitle="Tipo de sueño"
      />

      <Select
        label="Perspectiva"
        options={PERSPECTIVE_OPTIONS}
        value={perspective}
        onValueChange={(v) => { setPerspective(v); setSaved(false); }}
        modalTitle="Perspectiva"
      />

      <Switch
        label="¿Fue un sueño lúcido?"
        value={isLucid}
        onValueChange={(v) => { setIsLucid(v); setSaved(false); }}
      />

      {/* Life events */}
      <View style={styles.fieldRow}>
        <View style={styles.eventLabelRow}>
          <Text style={styles.fieldLabel}>Eventos de vida relacionados</Text>
          <Pressable onPress={openAddEvent} hitSlop={12} style={styles.addEventBtn}>
            <Ionicons name="add-circle" size={32} color={colors.accent} />
          </Pressable>
        </View>
        {loadingEvents ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : allEvents.length === 0 ? (
          <Pressable onPress={openAddEvent}>
            <Text style={styles.tabHintLink}>
              No hay eventos aún. Toca + para crear uno.
            </Text>
          </Pressable>
        ) : (
          <View style={styles.chipWrap}>
            {allEvents.map((ev) => (
              <Chip
                key={ev.id}
                label={ev.title}
                variant="teal"
                icon="calendar"
                selected={selectedEventIds.includes(ev.id)}
                onPress={() => toggleEvent(ev.id)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Add life event modal */}
      <RNModal
        visible={showAddEvent}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddEvent(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowAddEvent(false)}
          />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Nuevo evento de vida</Text>
            <Input
              label="Título"
              placeholder="Ej: Viaje a la playa, mudanza…"
              value={newEventTitle}
              onChangeText={setNewEventTitle}
              autoFocus
            />
            <Textarea
              label="Nota (opcional)"
              placeholder="Detalles adicionales"
              value={newEventNote}
              onChangeText={setNewEventNote}
              numberOfLines={4}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowAddEvent(false)}
                disabled={creatingEvent}
                hitSlop={8}
              >
                <Text style={styles.modalCancel}>Cancelar</Text>
              </Pressable>
              <Button
                variant="purple"
                onPress={handleCreateEvent}
                disabled={creatingEvent || !newEventTitle.trim()}
              >
                {creatingEvent ? 'Creando…' : 'Crear evento'}
              </Button>
            </View>
          </View>
        </View>
      </RNModal>

      <View style={styles.draftFooter}>
        {saved && (
          <View style={styles.savedRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.savedLabel}>Guardado</Text>
          </View>
        )}
        <Button variant="purple" onPress={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar estructura'}
        </Button>
      </View>
    </ScrollView>
  );
}

function TabReflection({ session, editing, onSessionChange }: TabProps) {
  const initial = session.userThought ?? '';
  const [thought, setThought] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = thought.trim() !== initial.trim();

  async function handleSave() {
    const trimmed = thought.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const updated = await dreamSessionsService.update(session.id, {
        status: DreamSessionStatus.ReflectionsDone,
        userThought: trimmed,
      });
      onSessionChange(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      console.warn('Failed to save reflection', e);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <ScrollView contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
        {initial ? (
          <Text style={styles.dreamText}>{initial}</Text>
        ) : (
          <Text style={styles.tabHint}>Aún sin reflexión.</Text>
        )}
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
    >
      <Text style={styles.tabHint}>¿Qué te dejó este sueño?</Text>

      <TextInput
        style={styles.fullTextarea}
        value={thought}
        onChangeText={(v) => {
          setThought(v);
          setSaved(false);
        }}
        placeholder="Este sueño me hizo pensar en…"
        placeholderTextColor={colors.textMuted}
        multiline
        textAlignVertical="top"
        autoFocus={!initial}
      />

      <View style={styles.draftFooter}>
        {saved && (
          <View style={styles.savedRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.savedLabel}>Guardado</Text>
          </View>
        )}
        <Button variant="purple" onPress={handleSave} disabled={saving || !thought.trim() || (!dirty && !!initial)}>
          {saving ? 'Guardando…' : 'Guardar reflexión'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

// ────────────────────────────────────────
// Main screen
// ────────────────────────────────────────
export default function DreamDetailScreen() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bg = gradients.background;

  const editing = mode === 'edit';

  const [session, setSession] = useState<DreamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Draft');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          setLoading(true);
          const data = await dreamSessionsService.get(id!);
          if (!cancelled) {
            setSession(data);
            setActiveTab(statusToTab(data.status as DreamSessionStatus));
          }
        } catch (e) {
          console.warn('Failed to load dream session', e);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [id]),
  );

  // ── Loading / error states ──
  if (loading) {
    return (
      <LinearGradient colors={[...bg.colors]} start={bg.start} end={bg.end} style={styles.root}>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </LinearGradient>
    );
  }

  if (!session) {
    return (
      <LinearGradient colors={[...bg.colors]} start={bg.start} end={bg.end} style={styles.root}>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <Text style={styles.errorText}>Sueño no encontrado</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.linkText}>Volver</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const statusKey = session.status as DreamSessionStatus;

  function handleSessionChange(updated: DreamSession) {
    setSession(updated);
  }

  const tabProps: TabProps = {
    session: session!,
    editing,
    onSessionChange: handleSessionChange,
  };

  function renderTabContent() {
    switch (activeTab) {
      case 'Draft':
        return <TabDraft {...tabProps} />;
      case 'Refining':
        return <TabRefiningWrapper {...tabProps} />;
      case 'Structured':
        return <TabStructured {...tabProps} />;
      case 'Reflection':
        return <TabReflection {...tabProps} />;
    }
  }

  return (
    <LinearGradient
      colors={[...bg.colors]}
      start={bg.start}
      end={bg.end}
      style={styles.root}
    >
      <View style={[styles.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Sueño</Text>
            <View style={styles.headerMeta}>
              <Text style={styles.dateText}>{formatDate(session.timestamp)}</Text>
              <Text style={[styles.statusBadge, { color: STATUS_COLOR[statusKey] }]}>
                {STATUS_LABEL[statusKey]}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Tab bar ── */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabItem, active && styles.tabItemActive]}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {TAB_LABEL[tab]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Content ── */}
        <View style={styles.contentArea}>
          {renderTabContent()}
        </View>
      </View>
    </LinearGradient>
  );
}

// ────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  safe: { flex: 1, paddingHorizontal: spacing.xl },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  backBtn: { marginLeft: -spacing.xs, padding: spacing.xs },
  headerText: { flex: 1 },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dateText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  statusBadge: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.lg,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabItemActive: {
    backgroundColor: colors.accent,
  },
  tabLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.textInverse,
    fontWeight: typography.weights.semibold,
  },

  // Content area
  flex: { flex: 1 },
  contentArea: { flex: 1 },
  tabScrollContent: { paddingBottom: spacing.xxl, gap: spacing.md },

  // Draft tab
  fullTextarea: {
    flex: 1,
    fontSize: typography.sizes.xl,
    lineHeight: 32,
    color: colors.text,
    padding: 0,
  },
  draftFooter: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  savedLabel: {
    fontSize: typography.sizes.sm,
    color: colors.success,
    fontWeight: typography.weights.medium,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnPressed: { opacity: 0.85 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnLabel: {
    color: colors.textInverse,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },

  // Shared tab styles
  tabHint: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  dreamText: {
    fontSize: typography.sizes.lg,
    color: colors.text,
    lineHeight: 28,
  },
  fieldRow: {
    gap: spacing.xs,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  eventLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addEventBtn: {
    padding: spacing.xs,
  },
  tabHintLink: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  modalCancel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as any,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  fieldValue: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },

  // Error / link
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  linkText: {
    fontSize: typography.sizes.md,
    color: colors.accent,
    fontWeight: typography.weights.semibold,
  },
});
