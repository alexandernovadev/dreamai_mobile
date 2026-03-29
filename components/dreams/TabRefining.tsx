import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Modal } from '@/components/ui/Modal';
import { dreamSessionsService, aiService } from '@/services';
import {
  DreamSessionStatus,
  Perspective,
  type DreamSession,
  type DreamSegmentAnalysis,
} from '@/lib/docs/types/dream';
import { Archetype, type Character } from '@/lib/docs/types/character';
import type { Location, LocationSetting } from '@/lib/docs/types/location';
import type { DreamObject } from '@/lib/docs/types/dream-object';
import { FeelingKind, type Feeling } from '@/lib/docs/types/feeling';

// ── Props ──
export type TabRefiningProps = {
  session: DreamSession;
  editing: boolean;
  onSessionChange: (updated: DreamSession) => void;
};

// ── Select options ──
const ARCHETYPE_OPTIONS = [
  { value: 'SHADOW', label: 'Sombra' },
  { value: 'ANIMA_ANIMUS', label: 'Ánima / Ánimus' },
  { value: 'WISE_FIGURE', label: 'Sabio / Guía' },
  { value: 'PERSONA', label: 'Persona' },
  { value: 'UNKNOWN', label: 'Desconocido' },
];

const SETTING_OPTIONS = [
  { value: 'URBAN', label: 'Urbano' },
  { value: 'NATURE', label: 'Naturaleza' },
  { value: 'INDOOR', label: 'Interior' },
  { value: 'ABSTRACT', label: 'Abstracto' },
];

const FEELING_OPTIONS = Object.values(FeelingKind).map((v) => ({
  value: v,
  label: v.charAt(0) + v.slice(1).toLowerCase(),
}));

type EntityType = 'character' | 'location' | 'object' | 'feeling';

const ENTITY_TYPE_OPTIONS: { type: EntityType; label: string; icon: string; color: string }[] = [
  { type: 'character', label: 'Personaje', icon: 'person', color: '#5B9CF6' },
  { type: 'location', label: 'Lugar', icon: 'location', color: '#6DD47E' },
  { type: 'object', label: 'Objeto', icon: 'cube', color: '#F0C850' },
  { type: 'feeling', label: 'Emoción', icon: 'heart', color: '#E06080' },
];

const ENTITY_COLORS: Record<EntityType, string> = {
  character: '#5B9CF6',
  location: '#6DD47E',
  object: '#F0C850',
  feeling: '#E06080',
};

function getAnalysis(session: DreamSession): DreamSegmentAnalysis | undefined {
  return session.dreams?.[0]?.analysis;
}

// ── Component ──
export function TabRefining({ session, editing, onSessionChange }: TabRefiningProps) {
  const text = session.rawNarrative ?? session.dreams?.[0]?.rawText ?? '';
  const analysis = getAnalysis(session);

  const [characters, setCharacters] = useState<Character[]>(analysis?.entities.characters ?? []);
  const [locations, setLocations] = useState<Location[]>(analysis?.entities.locations ?? []);
  const [objects, setObjects] = useState<DreamObject[]>(analysis?.entities.objects ?? []);
  const [feelings, setFeelings] = useState<Feeling[]>(analysis?.entities.feelings ?? []);

  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const hasSelection = selection.end > selection.start;
  const selectedQuote = hasSelection ? text.slice(selection.start, selection.end) : '';

  // Modal state
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [formType, setFormType] = useState<EntityType | null>(null);

  // Form fields
  const [fName, setFName] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fIsKnown, setFIsKnown] = useState(false);
  const [fArchetype, setFArchetype] = useState('UNKNOWN');
  const [fIsFamiliar, setFIsFamiliar] = useState(false);
  const [fSetting, setFSetting] = useState('ABSTRACT');
  const [fFeelingKind, setFFeelingKind] = useState('UNKNOWN');
  const [fNotes, setFNotes] = useState('');

  // Action state
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Confirm clear modal
  const [clearTarget, setClearTarget] = useState<EntityType | null>(null);

  const CLEAR_LABELS: Record<EntityType, string> = {
    character: 'personajes',
    location: 'lugares',
    object: 'objetos',
    feeling: 'emociones',
  };

  function confirmClearAll() {
    switch (clearTarget) {
      case 'character': setCharacters([]); break;
      case 'location': setLocations([]); break;
      case 'object': setObjects([]); break;
      case 'feeling': setFeelings([]); break;
    }
    setClearTarget(null);
  }

  const totalEntities = characters.length + locations.length + objects.length + feelings.length;

  // ── Handlers ──
  function openTypePicker() {
    if (!hasSelection) return;
    setTypePickerOpen(true);
  }

  function pickType(type: EntityType) {
    setTypePickerOpen(false);
    setFormType(type);
    setFName(selectedQuote);
    setFDesc('');
    setFIsKnown(false);
    setFArchetype('UNKNOWN');
    setFIsFamiliar(false);
    setFSetting('ABSTRACT');
    setFFeelingKind('UNKNOWN');
    setFNotes('');
  }

  function saveEntity() {
    const id = `e-${Date.now()}`;
    switch (formType) {
      case 'character':
        setCharacters((p) => [
          ...p,
          { id, name: fName, description: fDesc, isKnown: fIsKnown, archetype: fArchetype as Archetype },
        ]);
        break;
      case 'location':
        setLocations((p) => [
          ...p,
          { id, name: fName, description: fDesc, isFamiliar: fIsFamiliar, setting: fSetting as LocationSetting },
        ]);
        break;
      case 'object':
        setObjects((p) => [...p, { id, name: fName, description: fDesc }]);
        break;
      case 'feeling':
        setFeelings((p) => [
          ...p,
          { id, kind: fFeelingKind as FeelingKind, notes: fNotes || undefined },
        ]);
        break;
    }
    setFormType(null);
  }

  function removeEntity(type: EntityType, id: string) {
    switch (type) {
      case 'character':
        setCharacters((p) => p.filter((e) => e.id !== id));
        break;
      case 'location':
        setLocations((p) => p.filter((e) => e.id !== id));
        break;
      case 'object':
        setObjects((p) => p.filter((e) => e.id !== id));
        break;
      case 'feeling':
        setFeelings((p) => p.filter((e) => e.id !== id));
        break;
    }
  }

  async function handleAiSuggest() {
    if (!text.trim()) return;
    setAiLoading(true);
    try {
      const res = await aiService.suggestEntities({ text, locale: 'es' });
      let added = 0;
      for (const c of res.characters) {
        const id = `ai-${Date.now()}-${added++}`;
        setCharacters((p) => [
          ...p,
          { id, name: c.name, description: c.description, isKnown: c.isKnown, archetype: c.archetype },
        ]);
      }
      for (const l of res.locations) {
        const id = `ai-${Date.now()}-${added++}`;
        setLocations((p) => [
          ...p,
          { id, name: l.name, description: l.description, isFamiliar: l.isFamiliar, setting: l.setting },
        ]);
      }
      for (const o of res.objects) {
        const id = `ai-${Date.now()}-${added++}`;
        setObjects((p) => [...p, { id, name: o.name, description: o.description }]);
      }
      Alert.alert('IA', `Se sugirieron ${added} entidades.`);
    } catch (e) {
      console.warn('AI suggest failed', e);
      Alert.alert('Error', 'No se pudieron obtener sugerencias. Revisa tu conexión.');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const seg = session.dreams[0] ?? { id: `seg-${Date.now()}`, order: 0, rawText: text };
      const updatedAnalysis: DreamSegmentAnalysis = {
        perspective: analysis?.perspective ?? Perspective.Actor,
        entities: { characters, locations, objects, feelings },
        isLucid: analysis?.isLucid ?? false,
      };
      const updated = await dreamSessionsService.update(session.id, {
        status: DreamSessionStatus.Refining,
        dreams: [{ ...seg, analysis: updatedAnalysis }],
      });
      onSessionChange(updated);
      Alert.alert('Guardado', 'Refinamiento guardado.');
    } catch (e) {
      console.warn('Failed to save refining', e);
      Alert.alert('Error', 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  // ── Read mode ──
  if (!editing) {
    return (
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={s.dreamText}>{text || 'Sin texto'}</Text>
        {totalEntities === 0 && (
          <View style={s.hintRow}>
            <Ionicons name="pricetags-outline" size={18} color={colors.textMuted} />
            <Text style={s.hint}>Aún no se han etiquetado entidades.</Text>
          </View>
        )}
        <EntityList type="character" items={characters} />
        <EntityList type="location" items={locations} />
        <EntityList type="object" items={objects} />
        <FeelingList items={feelings} />
      </ScrollView>
    );
  }

  // ── Edit mode ──
  return (
    <View style={s.flex}>
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Selectable text */}
        <View style={s.textBox}>
          <TextInput
            value={text}
            editable={false}
            multiline
            scrollEnabled={false}
            style={s.selectableText}
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
          />
        </View>

        {/* Entity lists */}
        <EntityList type="character" items={characters} onRemove={(id) => removeEntity('character', id)} onRemoveAll={() => setClearTarget('character')} />
        <EntityList type="location" items={locations} onRemove={(id) => removeEntity('location', id)} onRemoveAll={() => setClearTarget('location')} />
        <EntityList type="object" items={objects} onRemove={(id) => removeEntity('object', id)} onRemoveAll={() => setClearTarget('object')} />
        <FeelingList items={feelings} onRemove={(id) => removeEntity('feeling', id)} onRemoveAll={() => setClearTarget('feeling')} />
      </ScrollView>

      {/* ── Sticky footer ── */}
      <View style={s.stickyFooter}>
        {hasSelection && (
          <Text style={s.selectionHint}>
            Selección: «{selectedQuote.length > 40 ? selectedQuote.slice(0, 40) + '…' : selectedQuote}»
          </Text>
        )}
        <View style={s.actionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={openTypePicker}
            disabled={!hasSelection}
            style={({ pressed }) => [
              s.actionBtn,
              !hasSelection && s.actionBtnDisabled,
              pressed && s.actionBtnPressed,
            ]}
          >
            <Ionicons name="pricetag" size={18} color={colors.textInverse} />
            <Text style={s.actionBtnLabel}>Etiquetar</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={handleAiSuggest}
            disabled={aiLoading}
            style={({ pressed }) => [
              s.actionBtn,
              s.actionBtnAi,
              aiLoading && s.actionBtnDisabled,
              pressed && s.actionBtnPressed,
            ]}
          >
            {aiLoading ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color={colors.textInverse} />
                <Text style={s.actionBtnLabel}>Sugerir con IA</Text>
              </>
            )}
          </Pressable>
        </View>

        <Button variant="purple" onPress={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar refinamiento'}
        </Button>
      </View>

      {/* ── Type picker modal ── */}
      <Modal visible={typePickerOpen} onClose={() => setTypePickerOpen(false)} title="¿Qué es?" closeLabel="Cancelar">
        <View style={s.typeGrid}>
          {ENTITY_TYPE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.type}
              accessibilityRole="button"
              onPress={() => pickType(opt.type)}
              style={({ pressed }) => [s.typeBtn, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name={opt.icon as any} size={28} color={opt.color} />
              <Text style={s.typeBtnLabel}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </Modal>

      {/* ── Entity form modal ── */}
      <Modal
        visible={formType !== null}
        onClose={() => setFormType(null)}
        title={
          formType === 'character'
            ? 'Personaje'
            : formType === 'location'
              ? 'Lugar'
              : formType === 'object'
                ? 'Objeto'
                : 'Emoción'
        }
        closeLabel="Cancelar"
      >
        {(formType === 'character' || formType === 'location' || formType === 'object') && (
          <>
            <Input label="Nombre" value={fName} onChangeText={setFName} placeholder="Nombre" />
            <Input label="Descripción" value={fDesc} onChangeText={setFDesc} placeholder="Opcional" />
          </>
        )}
        {formType === 'character' && (
          <>
            <Switch label="¿Es conocido?" value={fIsKnown} onValueChange={setFIsKnown} />
            <Select
              label="Arquetipo"
              options={ARCHETYPE_OPTIONS}
              value={fArchetype}
              onValueChange={setFArchetype}
              modalTitle="Arquetipo"
            />
          </>
        )}
        {formType === 'location' && (
          <>
            <Switch label="¿Es familiar?" value={fIsFamiliar} onValueChange={setFIsFamiliar} />
            <Select
              label="Escenario"
              options={SETTING_OPTIONS}
              value={fSetting}
              onValueChange={setFSetting}
              modalTitle="Escenario"
            />
          </>
        )}
        {formType === 'feeling' && (
          <>
            <Select
              label="Tipo de emoción"
              options={FEELING_OPTIONS}
              value={fFeelingKind}
              onValueChange={setFFeelingKind}
              modalTitle="Emoción"
            />
            <Input label="Notas" value={fNotes} onChangeText={setFNotes} placeholder="Opcional" />
          </>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={saveEntity}
          disabled={
            formType === 'feeling' ? fFeelingKind === 'UNKNOWN' : !fName.trim()
          }
          style={({ pressed }) => [
            s.saveBtn,
            pressed && s.saveBtnPressed,
            (formType === 'feeling' ? fFeelingKind === 'UNKNOWN' : !fName.trim()) && s.saveBtnDisabled,
          ]}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.textInverse} />
          <Text style={s.saveBtnLabel}>Agregar</Text>
        </Pressable>
      </Modal>

      {/* ── Confirm clear all modal ── */}
      <Modal
        visible={clearTarget !== null}
        onClose={() => setClearTarget(null)}
        title="Eliminar todos"
        closeLabel="Cancelar"
      >
        <View style={s.clearBody}>
          <Ionicons name="warning-outline" size={36} color={colors.danger} />
          <Text style={s.clearMessage}>
            ¿Estás seguro de eliminar todos los {clearTarget ? CLEAR_LABELS[clearTarget] : ''}?
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={confirmClearAll}
          style={({ pressed }) => [s.clearConfirmBtn, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="trash" size={18} color={colors.text} />
          <Text style={s.clearConfirmLabel}>Sí, eliminar todos</Text>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── Sub-components ──

function EntityList({
  type,
  items,
  onRemove,
  onRemoveAll,
}: {
  type: EntityType;
  items: { id: string; name: string; description?: string }[];
  onRemove?: (id: string) => void;
  onRemoveAll?: () => void;
}) {
  if (items.length === 0) return null;
  const meta = ENTITY_TYPE_OPTIONS.find((o) => o.type === type)!;
  return (
    <View style={s.entitySection}>
      <View style={s.entityHeader}>
        <Ionicons name={meta.icon as any} size={16} color={meta.color} />
        <Text style={[s.entityTitle, { color: meta.color }]}>
          {meta.label}s ({items.length})
        </Text>
        {onRemoveAll && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Eliminar todos los ${meta.label.toLowerCase()}s`}
            hitSlop={8}
            onPress={onRemoveAll}
            style={({ pressed }) => [s.clearBtn, pressed && { opacity: 0.5 }]}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </Pressable>
        )}
      </View>
      {items.map((item) => (
        <View key={item.id} style={s.entityRow}>
          <View style={[s.entityDot, { backgroundColor: ENTITY_COLORS[type] }]} />
          <View style={s.entityInfo}>
            <Text style={s.entityName}>{item.name}</Text>
            {item.description ? (
              <Text style={s.entityDesc} numberOfLines={1}>{item.description}</Text>
            ) : null}
          </View>
          {onRemove && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Eliminar"
              hitSlop={8}
              onPress={() => onRemove(item.id)}
              style={({ pressed }) => pressed && { opacity: 0.5 }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

function FeelingList({
  items,
  onRemove,
  onRemoveAll,
}: {
  items: Feeling[];
  onRemove?: (id: string) => void;
  onRemoveAll?: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <View style={s.entitySection}>
      <View style={s.entityHeader}>
        <Ionicons name="heart" size={16} color={ENTITY_COLORS.feeling} />
        <Text style={[s.entityTitle, { color: ENTITY_COLORS.feeling }]}>
          Emociones ({items.length})
        </Text>
        {onRemoveAll && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Eliminar todas las emociones"
            hitSlop={8}
            onPress={onRemoveAll}
            style={({ pressed }) => [s.clearBtn, pressed && { opacity: 0.5 }]}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </Pressable>
        )}
      </View>
      {items.map((item) => (
        <View key={item.id} style={s.entityRow}>
          <View style={[s.entityDot, { backgroundColor: ENTITY_COLORS.feeling }]} />
          <View style={s.entityInfo}>
            <Text style={s.entityName}>{item.kind}</Text>
            {item.notes ? (
              <Text style={s.entityDesc} numberOfLines={1}>{item.notes}</Text>
            ) : null}
          </View>
          {onRemove && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Eliminar"
              hitSlop={8}
              onPress={() => onRemove(item.id)}
              style={({ pressed }) => pressed && { opacity: 0.5 }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

// ── Styles ──
const s = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl, gap: spacing.sm },

  dreamText: { fontSize: typography.sizes.xl, color: colors.text, lineHeight: 32 },
  hint: { fontSize: typography.sizes.sm, color: colors.textMuted, fontStyle: 'italic' },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },

  textBox: {
    // no background/border — same feel as Draft
  },
  selectableText: {
    fontSize: typography.sizes.xl,
    lineHeight: 32,
    color: colors.text,
    padding: 0,
  },
  selectionHint: {
    fontSize: typography.sizes.sm,
    color: colors.accent,
    fontStyle: 'italic',
  },

  stickyFooter: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  actionBtnAi: {
    backgroundColor: colors.accent,
  },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnPressed: { opacity: 0.85 },
  actionBtnLabel: {
    color: colors.textInverse,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },

  // Entity list
  entitySection: { gap: spacing.xs },
  entityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  entityTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  entityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  entityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  entityInfo: { flex: 1 },
  entityName: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  entityDesc: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },

  // Type picker
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  typeBtn: {
    width: '45%',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
  },
  typeBtnLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },

  // Save
  saveBtn: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  saveBtnPressed: { opacity: 0.85 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnLabel: {
    color: colors.textInverse,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },

  // Clear all
  clearBtn: {
    marginLeft: 'auto',
    padding: spacing.xs,
  },
  clearBody: {
    alignItems: 'center',
    gap: spacing.md,
  },
  clearMessage: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  clearConfirmBtn: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearConfirmLabel: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
