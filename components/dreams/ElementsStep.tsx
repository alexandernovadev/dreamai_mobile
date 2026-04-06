import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  charactersService,
  contextLivesService,
  dreamEventsService,
  dreamObjectsService,
  locationsService,
  FEELING_KIND_OPTIONS,
} from '@/services';
import { Button, Chip, KeyboardAvoidingScroll } from '@/components/ui';
import { SuccessBanner } from '@/components/ui/SuccessBanner';
import { colors, spacing, typography } from '@/theme';
import { newKey } from '@/utils/key';
import { SearchBlock } from './ElementsStep/SearchBlock';
import { StepModals } from './ElementsStep/StepModals';
import { useElementsState } from './ElementsStep/hooks/useElementsState';
import { useEntitySearch } from './ElementsStep/hooks/useEntitySearch';
import type { StepModal } from './ElementsStep/types';

type Props = {
  sessionId: string;
  onSaved?: () => void;
  onError: (message: string, kind: 'network' | 'server') => void;
};

export function ElementsStep({ sessionId, onSaved, onError }: Props) {
  const {
    hydrating,
    characters, setCharacters,
    locations, setLocations,
    objects, setObjects,
    contextRows, setContextRows,
    events, setEvents,
    feelings, setFeelings,
    aiLoading,
    runAiSuggest,
    saving,
    successMsg,
    handleSave,
    addChar,
    addLoc,
    addObj,
    addCtx,
    addEv,
  } = useElementsState({ sessionId, onError, onSaved });

  const [stepModal, setStepModal] = useState<StepModal>(null);

  const charSearch = useEntitySearch({
    fetchFn: (q) => charactersService.list({ name: q, limit: 10 }),
    getResult: (c) => ({ id: c.id, label: c.name }),
    rows: characters,
  });

  const locSearch = useEntitySearch({
    fetchFn: (q) => locationsService.list({ name: q, limit: 10 }),
    getResult: (c) => ({ id: c.id, label: c.name }),
    rows: locations,
  });

  const objSearch = useEntitySearch({
    fetchFn: (q) => dreamObjectsService.list({ name: q, limit: 10 }),
    getResult: (c) => ({ id: c.id, label: c.name }),
    rows: objects,
  });

  const ctxSearch = useEntitySearch({
    fetchFn: (q) => contextLivesService.list({ title: q, limit: 10 }),
    getResult: (c) => ({ id: c.id, label: c.title }),
    rows: contextRows,
  });

  const evSearch = useEntitySearch({
    fetchFn: (q) => dreamEventsService.list({ label: q, dreamSessionId: sessionId, limit: 10 }),
    getResult: (c) => ({ id: c.id, label: c.label }),
    rows: events,
    enabled: Boolean(sessionId),
  });

  if (!sessionId) {
    return (
      <View style={styles.emptyGate}>
        <Text style={styles.emptyGateText}>Guarda el borrador para extraer entidades.</Text>
      </View>
    );
  }

  const chipLabel = (label: string, source?: 'ai' | 'user', emphasizeNew?: boolean) =>
    source === 'ai' ? `${label} · IA${emphasizeNew ? ' ✦' : ''} (nuevo)` : `${label} (nuevo)`;

  return (
    <View style={styles.wrap}>
      <KeyboardAvoidingScroll
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.aiRow}>
          <Button
            variant="outline"
            loading={aiLoading}
            onPress={() => void runAiSuggest()}
            disabled={hydrating}
          >
            Sugerir con IA
          </Button>
        </View>

        {hydrating ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : null}

        <SearchBlock
          title="Personajes"
          chipVariant="purple"
          placeholder="Buscar personaje…"
          query={charSearch.query}
          onQueryChange={charSearch.setQuery}
          suggestions={charSearch.suggestions}
          loading={charSearch.loading}
          onPick={(id, name) => { addChar(id, name); charSearch.setSuggestions([]); charSearch.setQuery(''); }}
          onCreate={() => setStepModal({ kind: 'character', mode: 'create', namePrefill: charSearch.query.trim() })}
          entries={characters.map((r) => ({
            key: r.key,
            label: r.t === 'existing' ? r.name : chipLabel(r.name, r.source, r.emphasizeNew),
            chipVariant: r.t === 'new' && r.emphasizeNew ? 'yellow' : undefined,
            onEdit: () => setStepModal({ kind: 'character', mode: 'edit', row: r }),
          }))}
          onRemove={(key) => setCharacters((p) => p.filter((r) => r.key !== key))}
        />

        <SearchBlock
          title="Lugares"
          chipVariant="blue"
          placeholder="Buscar lugar…"
          query={locSearch.query}
          onQueryChange={locSearch.setQuery}
          suggestions={locSearch.suggestions}
          loading={locSearch.loading}
          onPick={(id, name) => { addLoc(id, name); locSearch.setSuggestions([]); locSearch.setQuery(''); }}
          onCreate={() => setStepModal({ kind: 'location', mode: 'create', namePrefill: locSearch.query.trim() })}
          entries={locations.map((r) => ({
            key: r.key,
            label: r.t === 'existing' ? r.name : chipLabel(r.name, r.source, r.emphasizeNew),
            chipVariant: r.t === 'new' && r.emphasizeNew ? 'yellow' : undefined,
            onEdit: () => setStepModal({ kind: 'location', mode: 'edit', row: r }),
          }))}
          onRemove={(key) => setLocations((p) => p.filter((r) => r.key !== key))}
        />

        <SearchBlock
          title="Objetos"
          chipVariant="green"
          placeholder="Buscar objeto…"
          query={objSearch.query}
          onQueryChange={objSearch.setQuery}
          suggestions={objSearch.suggestions}
          loading={objSearch.loading}
          onPick={(id, name) => { addObj(id, name); objSearch.setSuggestions([]); objSearch.setQuery(''); }}
          onCreate={() => setStepModal({ kind: 'object', mode: 'create', namePrefill: objSearch.query.trim() })}
          entries={objects.map((r) => ({
            key: r.key,
            label: r.t === 'existing' ? r.name : chipLabel(r.name, r.source, r.emphasizeNew),
            chipVariant: r.t === 'new' && r.emphasizeNew ? 'yellow' : undefined,
            onEdit: () => setStepModal({ kind: 'object', mode: 'edit', row: r }),
          }))}
          onRemove={(key) => setObjects((p) => p.filter((r) => r.key !== key))}
        />

        <SearchBlock
          title="Contexto de la vida real"
          chipVariant="teal"
          placeholder="Buscar por título…"
          query={ctxSearch.query}
          onQueryChange={ctxSearch.setQuery}
          suggestions={ctxSearch.suggestions}
          loading={ctxSearch.loading}
          onPick={(id, title) => { addCtx(id, title); ctxSearch.setSuggestions([]); ctxSearch.setQuery(''); }}
          onCreate={() => setStepModal({ kind: 'context', mode: 'create', namePrefill: ctxSearch.query.trim() })}
          entries={contextRows.map((r) => ({
            key: r.key,
            label: r.t === 'existing' ? r.title : chipLabel(r.title, r.source, r.emphasizeNew),
            chipVariant: r.t === 'new' && r.emphasizeNew ? 'yellow' : undefined,
            onEdit: () => setStepModal({ kind: 'context', mode: 'edit', row: r }),
          }))}
          onRemove={(key) => setContextRows((p) => p.filter((r) => r.key !== key))}
        />

        <SearchBlock
          title="Eventos (en este sueño)"
          chipVariant="orange"
          placeholder="Buscar evento…"
          query={evSearch.query}
          onQueryChange={evSearch.setQuery}
          suggestions={evSearch.suggestions}
          loading={evSearch.loading}
          onPick={(id, label) => { addEv(id, label); evSearch.setSuggestions([]); evSearch.setQuery(''); }}
          onCreate={() => setStepModal({ kind: 'event', mode: 'create', namePrefill: evSearch.query.trim() })}
          entries={events.map((r) => ({
            key: r.key,
            label: r.t === 'existing' ? r.label : chipLabel(r.label, r.source, r.emphasizeNew),
            chipVariant: r.t === 'new' && r.emphasizeNew ? 'yellow' : undefined,
            onEdit: () => setStepModal({ kind: 'event', mode: 'edit', row: r }),
          }))}
          onRemove={(key) => setEvents((p) => p.filter((r) => r.key !== key))}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sentimientos</Text>
          <Text style={styles.sectionHint}>Añade una emoción por vez; la intensidad es opcional.</Text>
          <View style={styles.chipRow}>
            {feelings.map((f) => {
              const label = FEELING_KIND_OPTIONS.find((o) => o.value === f.kind)?.label ?? f.kind;
              return (
                <Chip
                  key={f.key}
                  label={f.intensity != null ? `${label} (${f.intensity})` : label}
                  variant="rose"
                  onEdit={() => setStepModal({ kind: 'feeling', mode: 'edit', row: f })}
                  onRemove={() => setFeelings((p) => p.filter((x) => x.key !== f.key))}
                />
              );
            })}
          </View>
          <Button variant="purple" onPress={() => setStepModal({ kind: 'feeling', mode: 'create' })}>
            + Añadir sentimiento
          </Button>
        </View>

        <View style={styles.saveBlock}>
          {successMsg ? <SuccessBanner message={successMsg} /> : null}
          <Button
            variant="purple"
            onPress={() => void handleSave()}
            disabled={saving || hydrating || aiLoading}
          >
            {saving ? 'Guardando…' : hydrating ? 'Cargando lista…' : 'Guardar elementos'}
          </Button>
        </View>
      </KeyboardAvoidingScroll>

      <StepModals
        modal={stepModal}
        sessionId={sessionId}
        onClose={() => setStepModal(null)}
        onError={onError}
        onAddCharacter={(row) => {
          setCharacters((p) => [...p, { key: newKey(), t: 'new', ...row }]);
          setStepModal(null);
        }}
        onUpdateCharacter={(next) =>
          setCharacters((p) =>
            p.map((r) => r.key !== next.key ? r : next.t === 'new' ? { ...next, source: 'user' as const } : next),
          )
        }
        onAddLocation={(row) => {
          setLocations((p) => [...p, { key: newKey(), t: 'new', ...row }]);
          setStepModal(null);
        }}
        onUpdateLocation={(next) =>
          setLocations((p) =>
            p.map((r) => r.key !== next.key ? r : next.t === 'new' ? { ...next, source: 'user' as const } : next),
          )
        }
        onAddObject={(row) => {
          setObjects((p) => [...p, { key: newKey(), t: 'new', ...row }]);
          setStepModal(null);
        }}
        onUpdateObject={(next) =>
          setObjects((p) =>
            p.map((r) => r.key !== next.key ? r : next.t === 'new' ? { ...next, source: 'user' as const } : next),
          )
        }
        onAddEvent={(row) => {
          setEvents((p) => [...p, { key: newKey(), t: 'new', ...row }]);
          setStepModal(null);
        }}
        onUpdateEvent={(next) =>
          setEvents((p) =>
            p.map((r) => r.key !== next.key ? r : next.t === 'new' ? { ...next, source: 'user' as const } : next),
          )
        }
        onAddContext={(row) => {
          setContextRows((p) => [...p, { key: newKey(), t: 'new', ...row }]);
          setStepModal(null);
        }}
        onUpdateContext={(next) =>
          setContextRows((p) =>
            p.map((r) => r.key !== next.key ? r : next.t === 'new' ? { ...next, source: 'user' as const } : next),
          )
        }
        onAddFeeling={(row) => {
          setFeelings((p) => [...p, { key: newKey(), ...row }]);
          setStepModal(null);
        }}
        onUpdateFeeling={(next) => setFeelings((p) => p.map((r) => r.key === next.key ? next : r))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 0 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl, gap: spacing.lg },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  sectionHint: { fontSize: typography.sizes.sm, color: colors.textMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  loader: { marginVertical: spacing.xs },
  aiRow: { alignSelf: 'flex-start' },
  saveBlock: { gap: spacing.md },
  emptyGate: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  emptyGateText: { textAlign: 'center', color: colors.textMuted, fontSize: typography.sizes.md },
});
