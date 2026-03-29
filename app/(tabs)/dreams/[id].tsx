import { useCallback, useEffect, useRef, useState } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
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
import { Slider } from '@/components/ui/Slider';
import {
  DreamKind,
  DreamSessionStatus,
  Perspective,
  lucidityLevelFromAnalysis,
  type DreamSession,
  type DreamSegmentAnalysis,
} from '@/lib/docs/types/dream';
import type { Character } from '@/lib/docs/types/character';
import type { Location } from '@/lib/docs/types/location';
import type { DreamObject } from '@/lib/docs/types/dream-object';
import type { Feeling } from '@/lib/docs/types/feeling';
import type { LifeEvent } from '@/lib/docs/types/life-event';
import { effectiveDreamDate, isLikelyPlaceholderDreamTimestamp } from '@/lib/dreamDate';

// ────────────────────────────────────────
// Tab definitions
// ────────────────────────────────────────
const TABS = ['Draft', 'Refining', 'Structured', 'Reflection'] as const;
type Tab = (typeof TABS)[number];

const NATIVE_DATE_PICKER = Platform.OS === 'ios' || Platform.OS === 'android';

const TAB_LABEL: Record<Tab, string> = {
  Draft: '1. Borrador',
  Refining: '2. Refinar',
  Structured: '3. Estructura',
  Reflection: '4. Reflexión',
};

const TAB_ICON: Record<Tab, keyof typeof Ionicons.glyphMap> = {
  Draft: 'document-text-outline',
  Refining: 'color-wand-outline',
  Structured: 'grid-outline',
  Reflection: 'bulb-outline',
};

// ── Read-mode tabs ──
const READ_TABS = ['Dream', 'Signal', 'Detail'] as const;
type ReadTab = (typeof READ_TABS)[number];

const READ_TAB_LABEL: Record<ReadTab, string> = {
  Dream: 'Sueño',
  Signal: 'Señales',
  Detail: 'Detalle',
};

const READ_TAB_ICON: Record<ReadTab, keyof typeof Ionicons.glyphMap> = {
  Dream: 'book-outline',
  Signal: 'prism-outline',
  Detail: 'information-circle-outline',
};

// ── Shared constants ──
const ENTITY_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  character: { icon: 'person', color: '#5B9CF6', label: 'Personajes' },
  location: { icon: 'location', color: '#6DD47E', label: 'Lugares' },
  object: { icon: 'cube', color: '#F0C850', label: 'Objetos' },
  feeling: { icon: 'heart', color: '#E06080', label: 'Emociones' },
};

const FEELING_LABELS: Record<string, string> = {
  FEAR: 'Miedo', ANXIETY: 'Ansiedad', JOY: 'Alegría', PEACE: 'Paz',
  SADNESS: 'Tristeza', ANGER: 'Ira', SHAME: 'Vergüenza', GUILT: 'Culpa',
  CONFUSION: 'Confusión', LONGING: 'Nostalgia', AWE: 'Asombro',
  DISGUST: 'Asco', NEUTRAL: 'Neutral', MIXED: 'Mixto', UNKNOWN: 'Desconocido',
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
        {initial ? (
          <Text style={styles.dreamText}>{initial}</Text>
        ) : (
          <View style={styles.emptyHintRow}>
            <Ionicons name="document-text-outline" size={20} color={colors.textMuted} />
            <Text style={styles.tabHint}>Sin texto aún</Text>
          </View>
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

const LUCIDITY_LABELS = [
  'Sin lucidez',
  'Leve',
  'Moderada',
  'Clara',
  'Muy clara',
  'Máxima',
] as const;

function TabStructured({ session, editing, onSessionChange }: TabProps) {
  const analysis = session.dreams?.[0]?.analysis;

  const [dreamKind, setDreamKind] = useState(session.dreamKind ?? DreamKind.Unknown);
  const [perspective, setPerspective] = useState<string>(
    analysis?.perspective ?? Perspective.Actor,
  );
  const [lucidityLevel, setLucidityLevel] = useState(() =>
    lucidityLevelFromAnalysis(analysis),
  );
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
        ? { ...seg.analysis, perspective: perspective as Perspective, lucidityLevel }
        : {
            perspective: perspective as Perspective,
            entities: { characters: [], locations: [], objects: [], feelings: [] },
            lucidityLevel,
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
          <View style={styles.fieldLabelRow}>
            <Ionicons name="cloudy-night-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.fieldLabel}>Tipo de sueño</Text>
          </View>
          <Text style={styles.fieldValue}>{kindLabel}</Text>
        </View>
        <View style={styles.fieldRow}>
          <View style={styles.fieldLabelRow}>
            <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.fieldLabel}>Perspectiva</Text>
          </View>
          <Text style={styles.fieldValue}>{perspLabel}</Text>
        </View>
        <View style={styles.fieldRow}>
          <View style={styles.fieldLabelRow}>
            <Ionicons name="flash-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.fieldLabel}>Lucidez</Text>
          </View>
          <Text style={styles.fieldValue}>
            {LUCIDITY_LABELS[lucidityLevelFromAnalysis(analysis)] ?? '—'}
          </Text>
        </View>
        {selectedEventNames.length > 0 && (
          <View style={styles.fieldRow}>
            <View style={styles.fieldLabelRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.fieldLabel}>Eventos de vida</Text>
            </View>
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

      <Slider
        label="Nivel de lucidez"
        hint="0 = sin lucidez · 5 = lucidez muy clara en el sueño."
        value={lucidityLevel}
        onValueChange={(v) => {
          setLucidityLevel(Math.round(v));
          setSaved(false);
        }}
        minimumValue={0}
        maximumValue={5}
        step={1}
        formatValue={(v) => {
          const n = Math.round(v);
          return `${n} · ${LUCIDITY_LABELS[n]}`;
        }}
      />

      {/* Life events */}
      <View style={styles.fieldRow}>
        <View style={styles.eventLabelRow}>
          <View style={styles.fieldLabelRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.fieldLabel}>Eventos de vida relacionados</Text>
          </View>
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
            <View style={styles.modalTitleRow}>
              <Ionicons name="calendar" size={22} color={colors.accent} />
              <Text style={styles.modalTitle}>Nuevo evento de vida</Text>
            </View>
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
          <View style={styles.emptyHintRow}>
            <Ionicons name="bulb-outline" size={20} color={colors.textMuted} />
            <Text style={styles.tabHint}>Aún sin reflexión.</Text>
          </View>
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
      <View style={styles.hintRow}>
        <Ionicons name="bulb-outline" size={18} color={colors.accent} />
        <Text style={styles.tabHintAccent}>¿Qué te dejó este sueño?</Text>
      </View>

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
// Read-mode tab components
// ────────────────────────────────────────

function ReadTabDream({ session }: { session: DreamSession }) {
  const text = session.rawNarrative ?? session.dreams?.[0]?.rawText ?? '';
  return (
    <ScrollView contentContainerStyle={rs.scrollContent} showsVerticalScrollIndicator={false}>
      {text ? (
        <Text style={rs.narrativeText}>{text}</Text>
      ) : (
        <View style={rs.emptyBlock}>
          <Ionicons name="document-text-outline" size={40} color={colors.textMuted} />
          <Text style={rs.emptyLabel}>Sin texto aún</Text>
        </View>
      )}
    </ScrollView>
  );
}

function ReadSignalSection({
  icon,
  color,
  label,
  count,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <View style={rs.signalSection}>
      <View style={rs.signalHeader}>
        <View style={[rs.signalIconBubble, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={[rs.signalTitle, { color }]}>{label}</Text>
        <View style={[rs.signalCount, { backgroundColor: color + '22' }]}>
          <Text style={[rs.signalCountText, { color }]}>{count}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function ReadTabSignal({ session }: { session: DreamSession }) {
  const analysis = session.dreams?.[0]?.analysis;
  const characters = analysis?.entities.characters ?? [];
  const locations = analysis?.entities.locations ?? [];
  const objects = analysis?.entities.objects ?? [];
  const feelings = analysis?.entities.feelings ?? [];
  const total = characters.length + locations.length + objects.length + feelings.length;

  if (total === 0) {
    return (
      <ScrollView contentContainerStyle={rs.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={rs.emptyBlock}>
          <Ionicons name="prism-outline" size={40} color={colors.textMuted} />
          <Text style={rs.emptyLabel}>Sin señales etiquetadas</Text>
          <Text style={rs.emptyHint}>Edita el sueño y refina para agregar personajes, lugares, objetos y emociones.</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={rs.scrollContent} showsVerticalScrollIndicator={false}>
      {characters.length > 0 && (
        <ReadSignalSection icon="person" color="#5B9CF6" label="Personajes" count={characters.length}>
          {characters.map((c) => (
            <View key={c.id} style={rs.signalCard}>
              <View style={rs.signalCardHeader}>
                <Text style={rs.signalCardName}>{c.name}</Text>
                {c.isKnown && (
                  <View style={rs.knownBadge}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                    <Text style={rs.knownBadgeText}>Conocido</Text>
                  </View>
                )}
              </View>
              {c.description ? <Text style={rs.signalCardDesc}>{c.description}</Text> : null}
              <View style={rs.signalCardMeta}>
                <Ionicons name="shield-outline" size={12} color={colors.textMuted} />
                <Text style={rs.signalCardMetaText}>
                  {c.archetype === 'SHADOW' ? 'Sombra' : c.archetype === 'ANIMA_ANIMUS' ? 'Ánima/Ánimus' : c.archetype === 'WISE_FIGURE' ? 'Sabio/Guía' : c.archetype === 'PERSONA' ? 'Persona' : 'Sin clasificar'}
                </Text>
              </View>
            </View>
          ))}
        </ReadSignalSection>
      )}

      {locations.length > 0 && (
        <ReadSignalSection icon="location" color="#6DD47E" label="Lugares" count={locations.length}>
          {locations.map((l) => (
            <View key={l.id} style={rs.signalCard}>
              <View style={rs.signalCardHeader}>
                <Text style={rs.signalCardName}>{l.name}</Text>
                {l.isFamiliar && (
                  <View style={rs.knownBadge}>
                    <Ionicons name="home" size={12} color={colors.success} />
                    <Text style={rs.knownBadgeText}>Familiar</Text>
                  </View>
                )}
              </View>
              {l.description ? <Text style={rs.signalCardDesc}>{l.description}</Text> : null}
              <View style={rs.signalCardMeta}>
                <Ionicons name="compass-outline" size={12} color={colors.textMuted} />
                <Text style={rs.signalCardMetaText}>
                  {l.setting === 'URBAN' ? 'Urbano' : l.setting === 'NATURE' ? 'Naturaleza' : l.setting === 'INDOOR' ? 'Interior' : 'Abstracto'}
                </Text>
              </View>
            </View>
          ))}
        </ReadSignalSection>
      )}

      {objects.length > 0 && (
        <ReadSignalSection icon="cube" color="#F0C850" label="Objetos" count={objects.length}>
          {objects.map((o) => (
            <View key={o.id} style={rs.signalCard}>
              <Text style={rs.signalCardName}>{o.name}</Text>
              {o.description ? <Text style={rs.signalCardDesc}>{o.description}</Text> : null}
            </View>
          ))}
        </ReadSignalSection>
      )}

      {feelings.length > 0 && (
        <ReadSignalSection icon="heart" color="#E06080" label="Emociones" count={feelings.length}>
          {feelings.map((f) => (
            <View key={f.id} style={rs.signalCard}>
              <Text style={rs.signalCardName}>{FEELING_LABELS[f.kind] ?? f.kind}</Text>
              {f.notes ? <Text style={rs.signalCardDesc}>{f.notes}</Text> : null}
            </View>
          ))}
        </ReadSignalSection>
      )}
    </ScrollView>
  );
}

function ReadTabDetail({ session }: { session: DreamSession }) {
  const analysis = session.dreams?.[0]?.analysis;
  const kindLabel = DREAM_KIND_OPTIONS.find((o) => o.value === session.dreamKind)?.label ?? session.dreamKind ?? 'Sin clasificar';
  const perspLabel = PERSPECTIVE_OPTIONS.find((o) => o.value === analysis?.perspective)?.label ?? 'Sin definir';
  const lucidity = lucidityLevelFromAnalysis(analysis);
  const reflection = session.userThought ?? '';

  const [allEvents, setAllEvents] = useState<LifeEvent[]>([]);
  const eventIds = session.relatedLifeEventIds ?? [];

  useEffect(() => {
    if (eventIds.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await lifeEventsService.list();
        if (!cancelled) setAllEvents(data);
      } catch {
        /* handled by global error */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const selectedEvents = eventIds
    .map((eid) => allEvents.find((e) => e.id === eid))
    .filter(Boolean) as LifeEvent[];

  return (
    <ScrollView contentContainerStyle={rs.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Classification */}
      <View style={rs.detailGroup}>
        <View style={rs.detailGroupHeader}>
          <Ionicons name="grid-outline" size={16} color={colors.accent} />
          <Text style={rs.detailGroupTitle}>Clasificación</Text>
        </View>

        <View style={rs.detailRow}>
          <View style={rs.detailLabelRow}>
            <Ionicons name="cloudy-night-outline" size={14} color={colors.textMuted} />
            <Text style={rs.detailLabel}>Tipo</Text>
          </View>
          <Text style={rs.detailValue}>{kindLabel}</Text>
        </View>

        <View style={rs.detailRow}>
          <View style={rs.detailLabelRow}>
            <Ionicons name="eye-outline" size={14} color={colors.textMuted} />
            <Text style={rs.detailLabel}>Perspectiva</Text>
          </View>
          <Text style={rs.detailValue}>{perspLabel}</Text>
        </View>

        <View style={rs.detailRow}>
          <View style={rs.detailLabelRow}>
            <Ionicons name="flash-outline" size={14} color={colors.textMuted} />
            <Text style={rs.detailLabel}>Lucidez</Text>
          </View>
          <View style={rs.lucidityBadge}>
            <Text style={rs.lucidityLevelNum}>{lucidity}</Text>
            <Text style={rs.detailValue}>{LUCIDITY_LABELS[lucidity]}</Text>
          </View>
        </View>
      </View>

      {/* Life events */}
      {selectedEvents.length > 0 && (
        <View style={rs.detailGroup}>
          <View style={rs.detailGroupHeader}>
            <Ionicons name="calendar-outline" size={16} color={colors.accent} />
            <Text style={rs.detailGroupTitle}>Eventos de vida</Text>
          </View>
          <View style={styles.chipWrap}>
            {selectedEvents.map((ev) => (
              <Chip key={ev.id} label={ev.title} variant="teal" icon="calendar" />
            ))}
          </View>
        </View>
      )}

      {/* Reflection */}
      <View style={rs.detailGroup}>
        <View style={rs.detailGroupHeader}>
          <Ionicons name="bulb-outline" size={16} color={colors.accent} />
          <Text style={rs.detailGroupTitle}>Reflexión</Text>
        </View>
        {reflection ? (
          <Text style={rs.reflectionText}>{reflection}</Text>
        ) : (
          <View style={rs.emptyInline}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.textMuted} />
            <Text style={rs.emptyInlineText}>Aún sin reflexión</Text>
          </View>
        )}
      </View>
    </ScrollView>
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
  const [activeReadTab, setActiveReadTab] = useState<ReadTab>('Dream');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState(() => new Date());
  const [dateSaving, setDateSaving] = useState(false);
  const placeholderTimestampFixSent = useRef<Set<string>>(new Set());

  useEffect(() => {
    placeholderTimestampFixSent.current.clear();
  }, [id]);

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

  useEffect(() => {
    if (loading || !session) return;
    if (!isLikelyPlaceholderDreamTimestamp(session.timestamp)) return;
    if (placeholderTimestampFixSent.current.has(session.id)) return;
    let cancelled = false;
    (async () => {
      try {
        const now = new Date();
        const updated = await dreamSessionsService.update(session.id, { timestamp: now });
        if (cancelled) return;
        placeholderTimestampFixSent.current.add(session.id);
        setSession(updated);
      } catch {
        // permite reintentar si el usuario vuelve a entrar o cambia la sesión
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, session]);

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
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorText}>Sueño no encontrado</Text>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Ionicons name="arrow-back" size={16} color={colors.accent} />
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

  function openDreamDatePicker() {
    if (!session || !editing || !NATIVE_DATE_PICKER) return;
    setPendingDate(effectiveDreamDate(session));
    setDatePickerOpen(true);
  }

  async function commitDreamDate(next: Date) {
    if (!session) return;
    const placeholder = isLikelyPlaceholderDreamTimestamp(session.timestamp);
    if (!placeholder && next.getTime() === session.timestamp.getTime()) {
      setDatePickerOpen(false);
      return;
    }
    setDateSaving(true);
    try {
      const updated = await dreamSessionsService.update(session.id, { timestamp: next });
      setSession(updated);
    } catch (e) {
      console.warn('Failed to update dream date', e);
    } finally {
      setDateSaving(false);
      setDatePickerOpen(false);
    }
  }

  const tabProps: TabProps = {
    session: session!,
    editing,
    onSessionChange: handleSessionChange,
  };

  function renderEditTabContent() {
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

  function renderReadTabContent() {
    switch (activeReadTab) {
      case 'Dream':
        return <ReadTabDream session={session!} />;
      case 'Signal':
        return <ReadTabSignal session={session!} />;
      case 'Detail':
        return <ReadTabDetail session={session!} />;
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
              {editing && NATIVE_DATE_PICKER ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cambiar fecha del sueño"
                  onPress={openDreamDatePicker}
                  style={({ pressed }) => [styles.datePressable, pressed && { opacity: 0.75 }]}
                >
                  <Ionicons name="calendar-outline" size={14} color={colors.accent} />
                  <Text style={styles.dateTextEditable}>{formatDate(effectiveDreamDate(session))}</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.accent} />
                </Pressable>
              ) : (
                <>
                  <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.dateText}>{formatDate(effectiveDreamDate(session))}</Text>
                </>
              )}
              <View style={styles.metaDot} />
              <Ionicons name="ellipse" size={8} color={STATUS_COLOR[statusKey]} />
              <Text style={[styles.statusBadge, { color: STATUS_COLOR[statusKey] }]}>
                {STATUS_LABEL[statusKey]}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Tab bar ── */}
        {editing ? (
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
                  <Ionicons
                    name={TAB_ICON[tab]}
                    size={14}
                    color={active ? colors.textInverse : colors.textMuted}
                  />
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {TAB_LABEL[tab]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.tabBar}>
            {READ_TABS.map((tab) => {
              const active = activeReadTab === tab;
              return (
                <Pressable
                  key={tab}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => setActiveReadTab(tab)}
                  style={[styles.tabItem, active && styles.tabItemActive]}
                >
                  <Ionicons
                    name={READ_TAB_ICON[tab]}
                    size={16}
                    color={active ? colors.textInverse : colors.textMuted}
                  />
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {READ_TAB_LABEL[tab]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* ── Content ── */}
        <View style={styles.contentArea}>
          {editing ? renderEditTabContent() : renderReadTabContent()}
        </View>

        {datePickerOpen && Platform.OS === 'android' && (
          <DateTimePicker
            value={pendingDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setDatePickerOpen(false);
              if (event.type === 'set' && date) {
                void commitDreamDate(date);
              }
            }}
          />
        )}
      </View>

      <RNModal
        visible={datePickerOpen && Platform.OS === 'ios'}
        transparent
        animationType="fade"
        onRequestClose={() => setDatePickerOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => !dateSaving && setDatePickerOpen(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalTitleRow}>
              <Ionicons name="calendar" size={22} color={colors.accent} />
              <Text style={styles.modalTitle}>Fecha del sueño</Text>
            </View>
            <DateTimePicker
              value={pendingDate}
              mode="date"
              display="spinner"
              themeVariant="dark"
              onChange={(_, date) => {
                if (date) setPendingDate(date);
              }}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => !dateSaving && setDatePickerOpen(false)} hitSlop={8}>
                <Text style={styles.modalCancel}>Cancelar</Text>
              </Pressable>
              <Button
                variant="purple"
                onPress={() => void commitDreamDate(pendingDate)}
                disabled={dateSaving}
              >
                {dateSaving ? 'Guardando…' : 'Guardar fecha'}
              </Button>
            </View>
          </View>
        </View>
      </RNModal>
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
  datePressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTextEditable: {
    fontSize: typography.sizes.sm,
    color: colors.accent,
    fontWeight: typography.weights.medium,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
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
    flexDirection: 'row',
    gap: 4,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
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
  tabHintAccent: {
    fontSize: typography.sizes.sm,
    color: colors.accent,
    fontStyle: 'italic',
  },
  emptyHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
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
    flex: 1,
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
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  linkText: {
    fontSize: typography.sizes.md,
    color: colors.accent,
    fontWeight: typography.weights.semibold,
  },
});

// ── Read-mode styles ──
const rs = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },

  // Dream tab
  narrativeText: {
    fontSize: typography.sizes.xl,
    lineHeight: 32,
    color: colors.text,
  },

  // Empty states
  emptyBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyLabel: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  emptyHint: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 20,
  },
  emptyInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  emptyInlineText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  // Signal tab
  signalSection: {
    gap: spacing.sm,
  },
  signalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  signalIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalTitle: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  signalCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  signalCountText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  signalCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    gap: spacing.xs,
    marginLeft: spacing.xxl,
  },
  signalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signalCardName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  signalCardDesc: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  signalCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  signalCardMetaText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  knownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(64, 240, 160, 0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  knownBadgeText: {
    fontSize: typography.sizes.xs,
    color: colors.success,
    fontWeight: typography.weights.medium,
  },

  // Detail tab
  detailGroup: {
    gap: spacing.md,
  },
  detailGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  detailGroupTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  lucidityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
  lucidityLevelNum: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.accent,
    minWidth: 18,
    textAlign: 'right',
  },
  reflectionText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    lineHeight: 24,
    fontStyle: 'italic',
  },
});
