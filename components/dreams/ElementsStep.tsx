import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  CHARACTER_ARCHETYPE_OPTIONS,
  type CharacterArchetype,
  LOCATION_SETTING_OPTIONS,
  type LocationSetting,
  type FeelingKind,
  FEELING_KIND_OPTIONS,
  apiErrorMessage,
  ApiError,
  charactersService,
  contextLivesService,
  dreamEventsService,
  dreamObjectsService,
  dreamSessionsService,
  feelingsService,
  locationsService,
} from '@/services';
import type { SelectOption } from '@/components/ui';
import {
  Button,
  Chip,
  Input,
  KeyboardAvoidingScroll,
  Modal,
  Select,
  Slider,
  Switch,
  Textarea,
} from '@/components/ui';
import type { ChipVariant } from '@/components/ui/Chip';
import { colors, radius, spacing, typography } from '@/theme';
import { entityRefId } from '@/utils/entityRef';
import { newKey } from '@/utils/key';

const ARCHETYPE_SELECT: SelectOption[] = CHARACTER_ARCHETYPE_OPTIONS.map(
  (o) => ({ value: o.value, label: o.label }),
);
const SETTING_SELECT: SelectOption[] = LOCATION_SETTING_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));
const FEELING_SELECT: SelectOption[] = FEELING_KIND_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

type CharRow =
  | { key: string; t: 'existing'; id: string; name: string }
  | {
      key: string;
      t: 'new';
      name: string;
      description: string;
      isKnown: boolean;
      archetype: CharacterArchetype;
    };

type LocRow =
  | { key: string; t: 'existing'; id: string; name: string }
  | {
      key: string;
      t: 'new';
      name: string;
      description: string;
      isFamiliar: boolean;
      setting: LocationSetting;
    };

type ObjRow =
  | { key: string; t: 'existing'; id: string; name: string }
  | { key: string; t: 'new'; name: string; description?: string };

type CtxRow =
  | { key: string; t: 'existing'; id: string; title: string }
  | { key: string; t: 'new'; title: string; description?: string };

type EventRow =
  | { key: string; t: 'existing'; id: string; label: string }
  | { key: string; t: 'new'; label: string; description?: string };

type FeelingRow = {
  key: string;
  kind: FeelingKind;
  intensity?: number;
  notes?: string;
};

type CreateModal =
  | { kind: 'character'; namePrefill: string }
  | { kind: 'location'; namePrefill: string }
  | { kind: 'object'; namePrefill: string }
  | { kind: 'event'; namePrefill: string }
  | { kind: 'context'; namePrefill: string }
  | { kind: 'feeling' }
  | null;

type Props = {
  sessionId: string;
  /** Opcional: p. ej. analytics cuando el usuario guarda elementos en el servidor. */
  onSaved?: () => void;
  onError: (message: string, kind: 'network' | 'server') => void;
};

export function ElementsStep({ sessionId, onSaved, onError }: Props) {
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const [saving, setSaving] = useState(false);

  const [characters, setCharacters] = useState<CharRow[]>([]);
  const [locations, setLocations] = useState<LocRow[]>([]);
  const [objects, setObjects] = useState<ObjRow[]>([]);
  const [contextRows, setContextRows] = useState<CtxRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [feelings, setFeelings] = useState<FeelingRow[]>([]);

  const [qChar, setQChar] = useState('');
  const [sugChar, setSugChar] = useState<{ id: string; label: string }[]>([]);
  const [loadChar, setLoadChar] = useState(false);

  const [qLoc, setQLoc] = useState('');
  const [sugLoc, setSugLoc] = useState<{ id: string; label: string }[]>([]);
  const [loadLoc, setLoadLoc] = useState(false);

  const [qObj, setQObj] = useState('');
  const [sugObj, setSugObj] = useState<{ id: string; label: string }[]>([]);
  const [loadObj, setLoadObj] = useState(false);

  const [qCtx, setQCtx] = useState('');
  const [sugCtx, setSugCtx] = useState<{ id: string; label: string }[]>([]);
  const [loadCtx, setLoadCtx] = useState(false);

  const [qEv, setQEv] = useState('');
  const [sugEv, setSugEv] = useState<{ id: string; label: string }[]>([]);
  const [loadEv, setLoadEv] = useState(false);

  const [createModal, setCreateModal] = useState<CreateModal>(null);
  const [hydrating, setHydrating] = useState(false);

  useEffect(() => {
    const sid = sessionId?.trim();
    if (!sid) return;

    let cancelled = false;
    setHydrating(true);

    void (async () => {
      try {
        const session = await dreamSessionsService.getOne(sid);
        const entities = session.analysis?.entities;
        if (!entities) {
          if (!cancelled) {
            setCharacters([]);
            setLocations([]);
            setObjects([]);
            setContextRows([]);
            setEvents([]);
            setFeelings([]);
          }
          return;
        }

        const charRows: CharRow[] = [];
        for (const r of entities.characters ?? []) {
          const id = entityRefId(r.characterId);
          if (!id) continue;
          try {
            const c = await charactersService.getOne(id);
            if (!cancelled) {
              charRows.push({ key: newKey(), t: 'existing', id: c.id, name: c.name });
            }
          } catch {
            /* catálogo borrado o id inválido */
          }
        }

        const locRows: LocRow[] = [];
        for (const r of entities.locations ?? []) {
          const id = entityRefId(r.locationId);
          if (!id) continue;
          try {
            const x = await locationsService.getOne(id);
            if (!cancelled) {
              locRows.push({ key: newKey(), t: 'existing', id: x.id, name: x.name });
            }
          } catch {
            /* skip */
          }
        }

        const objRows: ObjRow[] = [];
        for (const r of entities.objects ?? []) {
          const id = entityRefId(r.objectId);
          if (!id) continue;
          try {
            const x = await dreamObjectsService.getOne(id);
            if (!cancelled) {
              objRows.push({ key: newKey(), t: 'existing', id: x.id, name: x.name });
            }
          } catch {
            /* skip */
          }
        }

        const ctxRows: CtxRow[] = [];
        for (const r of entities.contextLife ?? []) {
          const id = entityRefId(r.contextLifeId);
          if (!id) continue;
          try {
            const x = await contextLivesService.getOne(id);
            if (!cancelled) {
              ctxRows.push({ key: newKey(), t: 'existing', id: x.id, title: x.title });
            }
          } catch {
            /* skip */
          }
        }

        const evRows: EventRow[] = [];
        for (const r of entities.events ?? []) {
          const id = entityRefId(r.eventId);
          if (!id) continue;
          try {
            const x = await dreamEventsService.getOne(id);
            if (!cancelled) {
              evRows.push({ key: newKey(), t: 'existing', id: x.id, label: x.label });
            }
          } catch {
            /* skip */
          }
        }

        const feelRows: FeelingRow[] = [];
        for (const r of entities.feelings ?? []) {
          const id = entityRefId(r.feelingId);
          if (!id) continue;
          try {
            const x = await feelingsService.getOne(id);
            if (!cancelled) {
              feelRows.push({
                key: newKey(),
                kind: x.kind,
                intensity: x.intensity,
                notes: x.notes,
              });
            }
          } catch {
            /* skip */
          }
        }

        if (!cancelled) {
          setCharacters(charRows);
          setLocations(locRows);
          setObjects(objRows);
          setContextRows(ctxRows);
          setEvents(evRows);
          setFeelings(feelRows);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = apiErrorMessage(e);
          const kind = e instanceof ApiError && e.status === 0 ? 'network' : 'server';
          onErrorRef.current(msg, kind);
        }
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const charIds = useMemo(() => {
    const ids: string[] = [];
    for (const r of characters) {
      if (r.t === 'existing') ids.push(r.id);
    }
    return new Set(ids);
  }, [characters]);

  useEffect(() => {
    const q = qChar.trim();
    if (q.length < 1) {
      setSugChar([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      setLoadChar(true);
      void charactersService
        .list({ name: q, limit: 10 })
        .then((res) => {
          if (!cancelled) {
            setSugChar(
              res.data.map((c) => ({ id: c.id, label: c.name })).filter((x) => !charIds.has(x.id)),
            );
          }
        })
        .catch(() => {
          if (!cancelled) setSugChar([]);
        })
        .finally(() => {
          if (!cancelled) setLoadChar(false);
        });
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [qChar, charIds]);

  const locIds = useMemo(() => {
    const ids: string[] = [];
    for (const r of locations) {
      if (r.t === 'existing') ids.push(r.id);
    }
    return new Set(ids);
  }, [locations]);

  useEffect(() => {
    const q = qLoc.trim();
    if (q.length < 1) {
      setSugLoc([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      setLoadLoc(true);
      void locationsService
        .list({ name: q, limit: 10 })
        .then((res) => {
          if (!cancelled) {
            setSugLoc(
              res.data.map((c) => ({ id: c.id, label: c.name })).filter((x) => !locIds.has(x.id)),
            );
          }
        })
        .catch(() => {
          if (!cancelled) setSugLoc([]);
        })
        .finally(() => {
          if (!cancelled) setLoadLoc(false);
        });
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [qLoc, locIds]);

  const objIds = useMemo(() => {
    const ids: string[] = [];
    for (const r of objects) {
      if (r.t === 'existing') ids.push(r.id);
    }
    return new Set(ids);
  }, [objects]);

  useEffect(() => {
    const q = qObj.trim();
    if (q.length < 1) {
      setSugObj([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      setLoadObj(true);
      void dreamObjectsService
        .list({ name: q, limit: 10 })
        .then((res) => {
          if (!cancelled) {
            setSugObj(
              res.data.map((c) => ({ id: c.id, label: c.name })).filter((x) => !objIds.has(x.id)),
            );
          }
        })
        .catch(() => {
          if (!cancelled) setSugObj([]);
        })
        .finally(() => {
          if (!cancelled) setLoadObj(false);
        });
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [qObj, objIds]);

  const ctxIds = useMemo(() => {
    const ids: string[] = [];
    for (const r of contextRows) {
      if (r.t === 'existing') ids.push(r.id);
    }
    return new Set(ids);
  }, [contextRows]);

  useEffect(() => {
    const q = qCtx.trim();
    if (q.length < 1) {
      setSugCtx([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      setLoadCtx(true);
      void contextLivesService
        .list({ title: q, limit: 10 })
        .then((res) => {
          if (!cancelled) {
            setSugCtx(
              res.data.map((c) => ({ id: c.id, label: c.title })).filter((x) => !ctxIds.has(x.id)),
            );
          }
        })
        .catch(() => {
          if (!cancelled) setSugCtx([]);
        })
        .finally(() => {
          if (!cancelled) setLoadCtx(false);
        });
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [qCtx, ctxIds]);

  const evIds = useMemo(() => {
    const ids: string[] = [];
    for (const r of events) {
      if (r.t === 'existing') ids.push(r.id);
    }
    return new Set(ids);
  }, [events]);

  useEffect(() => {
    const q = qEv.trim();
    if (q.length < 1 || !sessionId) {
      setSugEv([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      setLoadEv(true);
      void dreamEventsService
        .list({ label: q, dreamSessionId: sessionId, limit: 10 })
        .then((res) => {
          if (!cancelled) {
            setSugEv(
              res.data.map((c) => ({ id: c.id, label: c.label })).filter((x) => !evIds.has(x.id)),
            );
          }
        })
        .catch(() => {
          if (!cancelled) setSugEv([]);
        })
        .finally(() => {
          if (!cancelled) setLoadEv(false);
        });
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [qEv, evIds, sessionId]);

  const addChar = useCallback((id: string, name: string) => {
    setCharacters((prev) => {
      if (prev.some((r) => r.t === 'existing' && r.id === id)) return prev;
      return [...prev, { key: newKey(), t: 'existing', id, name }];
    });
    setQChar('');
    setSugChar([]);
  }, []);

  const addLoc = useCallback((id: string, name: string) => {
    setLocations((prev) => {
      if (prev.some((r) => r.t === 'existing' && r.id === id)) return prev;
      return [...prev, { key: newKey(), t: 'existing', id, name }];
    });
    setQLoc('');
    setSugLoc([]);
  }, []);

  const addObj = useCallback((id: string, name: string) => {
    setObjects((prev) => {
      if (prev.some((r) => r.t === 'existing' && r.id === id)) return prev;
      return [...prev, { key: newKey(), t: 'existing', id, name }];
    });
    setQObj('');
    setSugObj([]);
  }, []);

  const addCtx = useCallback((id: string, title: string) => {
    setContextRows((prev) => {
      if (prev.some((r) => r.t === 'existing' && r.id === id)) return prev;
      return [...prev, { key: newKey(), t: 'existing', id, title }];
    });
    setQCtx('');
    setSugCtx([]);
  }, []);

  const addEv = useCallback((id: string, label: string) => {
    setEvents((prev) => {
      if (prev.some((r) => r.t === 'existing' && r.id === id)) return prev;
      return [...prev, { key: newKey(), t: 'existing', id, label }];
    });
    setQEv('');
    setSugEv([]);
  }, []);

  async function handleSave() {
    if (!sessionId) {
      onError('Falta la sesión de sueño. Guarda el borrador primero.', 'server');
      return;
    }
    setSaving(true);
    try {
      const characterIds: string[] = [];
      for (const row of characters) {
        if (row.t === 'existing') characterIds.push(row.id);
        else {
          const c = await charactersService.create({
            name: row.name.trim(),
            description: row.description.trim(),
            isKnown: row.isKnown,
            archetype: row.archetype,
          });
          characterIds.push(c.id);
        }
      }

      const locationIds: string[] = [];
      for (const row of locations) {
        if (row.t === 'existing') locationIds.push(row.id);
        else {
          const c = await locationsService.create({
            name: row.name.trim(),
            description: row.description.trim(),
            isFamiliar: row.isFamiliar,
            setting: row.setting,
          });
          locationIds.push(c.id);
        }
      }

      const objectIds: string[] = [];
      for (const row of objects) {
        if (row.t === 'existing') objectIds.push(row.id);
        else {
          const c = await dreamObjectsService.create({
            name: row.name.trim(),
            description: row.description?.trim() || undefined,
          });
          objectIds.push(c.id);
        }
      }

      const contextLifeIds: string[] = [];
      for (const row of contextRows) {
        if (row.t === 'existing') contextLifeIds.push(row.id);
        else {
          const c = await contextLivesService.create({
            title: row.title.trim(),
            description: row.description?.trim() || undefined,
          });
          contextLifeIds.push(c.id);
        }
      }

      const eventIds: string[] = [];
      for (const row of events) {
        if (row.t === 'existing') eventIds.push(row.id);
        else {
          const c = await dreamEventsService.create({
            label: row.label.trim(),
            description: row.description?.trim() || undefined,
            dreamSessionId: sessionId,
          });
          eventIds.push(c.id);
        }
      }

      const feelingIds: string[] = [];
      for (const row of feelings) {
        const c = await feelingsService.create({
          kind: row.kind,
          dreamSessionId: sessionId,
          intensity: row.intensity,
          notes: row.notes?.trim() || undefined,
        });
        feelingIds.push(c.id);
      }

      const entities = {
        characters: [...new Set(characterIds)].map((id) => ({ characterId: id })),
        locations: [...new Set(locationIds)].map((id) => ({ locationId: id })),
        objects: [...new Set(objectIds)].map((id) => ({ objectId: id })),
        contextLife: [...new Set(contextLifeIds)].map((id) => ({ contextLifeId: id })),
        events: [...new Set(eventIds)].map((id) => ({ eventId: id })),
        feelings: [...new Set(feelingIds)].map((id) => ({ feelingId: id })),
      };

      await dreamSessionsService.update(sessionId, {
        status: 'ELEMENTS',
        analysis: { entities },
      });
      onSaved?.();
    } catch (e) {
      const msg = apiErrorMessage(e);
      const kind = e instanceof ApiError && e.status === 0 ? 'network' : 'server';
      onError(msg, kind);
    } finally {
      setSaving(false);
    }
  }

  if (!sessionId) {
    return (
      <View style={styles.emptyGate}>
        <Text style={styles.emptyGateText}>Guarda el borrador para extraer entidades.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <KeyboardAvoidingScroll
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Extrae personajes, lugares y el resto de elementos. Busca en tu catálogo o crea nuevos;
          todo se guardará en el servidor al pulsar el botón. La extracción asistida por IA irá en un
          paso aparte.
        </Text>

        {hydrating ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : null}

        <SearchBlock
          title="Personajes"
          chipVariant="purple"
          placeholder="Buscar personaje…"
          query={qChar}
          onQueryChange={setQChar}
          suggestions={sugChar}
          loading={loadChar}
          onPick={addChar}
          onCreate={() =>
            setCreateModal({ kind: 'character', namePrefill: qChar.trim() })
          }
          entries={characters.map((r) => ({
            key: r.key,
            label: r.t === 'existing' ? r.name : `${r.name} (nuevo)`,
          }))}
          onRemove={(key) => setCharacters((p) => p.filter((r) => r.key !== key))}
        />

        <SearchBlock
          title="Lugares"
          chipVariant="blue"
          placeholder="Buscar lugar…"
          query={qLoc}
          onQueryChange={setQLoc}
          suggestions={sugLoc}
          loading={loadLoc}
          onPick={addLoc}
          onCreate={() =>
            setCreateModal({ kind: 'location', namePrefill: qLoc.trim() })
          }
          entries={locations.map((r) => ({
            key: r.key,
            label: r.t === 'existing' ? r.name : `${r.name} (nuevo)`,
          }))}
          onRemove={(key) => setLocations((p) => p.filter((r) => r.key !== key))}
        />

        <SearchBlock
          title="Objetos"
          chipVariant="green"
          placeholder="Buscar objeto…"
          query={qObj}
          onQueryChange={setQObj}
          suggestions={sugObj}
          loading={loadObj}
          onPick={addObj}
          onCreate={() =>
            setCreateModal({ kind: 'object', namePrefill: qObj.trim() })
          }
          entries={objects.map((r) => ({
            key: r.key,
            label: r.t === 'existing' ? r.name : `${r.name} (nuevo)`,
          }))}
          onRemove={(key) => setObjects((p) => p.filter((r) => r.key !== key))}
        />

        <SearchBlock
          title="Contexto vital"
          chipVariant="teal"
          placeholder="Buscar por título…"
          query={qCtx}
          onQueryChange={setQCtx}
          suggestions={sugCtx}
          loading={loadCtx}
          onPick={addCtx}
          onCreate={() =>
            setCreateModal({ kind: 'context', namePrefill: qCtx.trim() })
          }
          entries={contextRows.map((r) => ({
            key: r.key,
            label: r.t === 'existing' ? r.title : `${r.title} (nuevo)`,
          }))}
          onRemove={(key) => setContextRows((p) => p.filter((r) => r.key !== key))}
        />

        <SearchBlock
          title="Eventos (en este sueño)"
          chipVariant="orange"
          placeholder="Buscar evento…"
          query={qEv}
          onQueryChange={setQEv}
          suggestions={sugEv}
          loading={loadEv}
          onPick={addEv}
          onCreate={() =>
            setCreateModal({ kind: 'event', namePrefill: qEv.trim() })
          }
          entries={events.map((r) => ({
            key: r.key,
            label: r.t === 'existing' ? r.label : `${r.label} (nuevo)`,
          }))}
          onRemove={(key) => setEvents((p) => p.filter((r) => r.key !== key))}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sentimientos</Text>
          <Text style={styles.sectionHint}>
            Añade una emoción por vez; la intensidad es opcional.
          </Text>
          <View style={styles.chipRow}>
            {feelings.map((f) => {
              const label =
                FEELING_KIND_OPTIONS.find((o) => o.value === f.kind)?.label ?? f.kind;
              return (
                <Chip
                  key={f.key}
                  label={f.intensity != null ? `${label} (${f.intensity})` : label}
                  variant="rose"
                  onRemove={() => setFeelings((p) => p.filter((x) => x.key !== f.key))}
                />
              );
            })}
          </View>
          <Button variant="purple" onPress={() => setCreateModal({ kind: 'feeling' })}>
            + Añadir sentimiento
          </Button>
        </View>

        <Button
          variant="purple"
          onPress={() => void handleSave()}
          disabled={saving || hydrating}
        >
          {saving ? 'Guardando…' : hydrating ? 'Cargando lista…' : 'Guardar elementos'}
        </Button>
      </KeyboardAvoidingScroll>

      <CreateModals
        modal={createModal}
        onClose={() => setCreateModal(null)}
        onAddCharacter={(row) => {
          setCharacters((p) => [
            ...p,
            {
              key: newKey(),
              t: 'new',
              name: row.name,
              description: row.description,
              isKnown: row.isKnown,
              archetype: row.archetype,
            },
          ]);
          setCreateModal(null);
        }}
        onAddLocation={(row) => {
          setLocations((p) => [
            ...p,
            {
              key: newKey(),
              t: 'new',
              name: row.name,
              description: row.description,
              isFamiliar: row.isFamiliar,
              setting: row.setting,
            },
          ]);
          setCreateModal(null);
        }}
        onAddObject={(row) => {
          setObjects((p) => [
            ...p,
            {
              key: newKey(),
              t: 'new',
              name: row.name,
              description: row.description,
            },
          ]);
          setCreateModal(null);
        }}
        onAddEvent={(row) => {
          setEvents((p) => [
            ...p,
            {
              key: newKey(),
              t: 'new',
              label: row.label,
              description: row.description,
            },
          ]);
          setCreateModal(null);
        }}
        onAddContext={(row) => {
          setContextRows((p) => [
            ...p,
            {
              key: newKey(),
              t: 'new',
              title: row.title,
              description: row.description,
            },
          ]);
          setCreateModal(null);
        }}
        onAddFeeling={(row) => {
          setFeelings((p) => [...p, { key: newKey(), ...row }]);
          setCreateModal(null);
        }}
      />
    </View>
  );
}

function SearchBlock(props: {
  title: string;
  chipVariant: ChipVariant;
  placeholder: string;
  query: string;
  onQueryChange: (q: string) => void;
  suggestions: { id: string; label: string }[];
  loading: boolean;
  onPick: (id: string, label: string) => void;
  onCreate: () => void;
  entries: { key: string; label: string }[];
  onRemove: (key: string) => void;
}) {
  const {
    title,
    chipVariant,
    placeholder,
    query,
    onQueryChange,
    suggestions,
    loading,
    onPick,
    onCreate,
    entries,
    onRemove,
  } = props;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Input
        placeholder={placeholder}
        value={query}
        onChangeText={onQueryChange}
        autoCapitalize="sentences"
        autoCorrect
      />
      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : null}
      {suggestions.length > 0 ? (
        <View style={styles.sugBox}>
          {suggestions.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => onPick(s.id, s.label)}
              style={({ pressed }) => [styles.sugRow, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="link-outline" size={18} color={colors.textMuted} />
              <Text style={styles.sugText} numberOfLines={2}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Pressable
        onPress={onCreate}
        style={({ pressed }) => [styles.createLink, pressed && { opacity: 0.7 }]}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
        <Text style={styles.createLinkText}>Crear nuevo…</Text>
      </Pressable>
      <View style={styles.chipRow}>
        {entries.map((e) => (
          <Chip
            key={e.key}
            label={e.label}
            variant={chipVariant}
            onRemove={() => onRemove(e.key)}
          />
        ))}
      </View>
    </View>
  );
}

function CreateModals(props: {
  modal: CreateModal;
  onClose: () => void;
  onAddCharacter: (row: {
    name: string;
    description: string;
    isKnown: boolean;
    archetype: CharacterArchetype;
  }) => void;
  onAddLocation: (row: {
    name: string;
    description: string;
    isFamiliar: boolean;
    setting: LocationSetting;
  }) => void;
  onAddObject: (row: { name: string; description?: string }) => void;
  onAddEvent: (row: { label: string; description?: string }) => void;
  onAddContext: (row: { title: string; description?: string }) => void;
  onAddFeeling: (row: {
    kind: FeelingKind;
    intensity?: number;
    notes?: string;
  }) => void;
}) {
  const {
    modal,
    onClose,
    onAddCharacter,
    onAddLocation,
    onAddObject,
    onAddEvent,
    onAddContext,
    onAddFeeling,
  } = props;

  if (modal?.kind === 'character') {
    return (
      <CharacterCreateModal
        key={`char-${modal.namePrefill}`}
        namePrefill={modal.namePrefill}
        onClose={onClose}
        onSubmit={onAddCharacter}
      />
    );
  }
  if (modal?.kind === 'location') {
    return (
      <LocationCreateModal
        key={`loc-${modal.namePrefill}`}
        namePrefill={modal.namePrefill}
        onClose={onClose}
        onSubmit={onAddLocation}
      />
    );
  }
  if (modal?.kind === 'object') {
    return (
      <ObjectCreateModal
        key={`obj-${modal.namePrefill}`}
        namePrefill={modal.namePrefill}
        onClose={onClose}
        onSubmit={onAddObject}
      />
    );
  }
  if (modal?.kind === 'event') {
    return (
      <EventCreateModal
        key={`ev-${modal.namePrefill}`}
        namePrefill={modal.namePrefill}
        onClose={onClose}
        onSubmit={onAddEvent}
      />
    );
  }
  if (modal?.kind === 'context') {
    return (
      <ContextCreateModal
        key={`ctx-${modal.namePrefill}`}
        namePrefill={modal.namePrefill}
        onClose={onClose}
        onSubmit={onAddContext}
      />
    );
  }
  if (modal?.kind === 'feeling') {
    return (
      <FeelingCreateModal key="feeling-new" onClose={onClose} onSubmit={onAddFeeling} />
    );
  }
  return null;
}

function CharacterCreateModal({
  namePrefill,
  onClose,
  onSubmit,
}: {
  namePrefill: string;
  onClose: () => void;
  onSubmit: (row: {
    name: string;
    description: string;
    isKnown: boolean;
    archetype: CharacterArchetype;
  }) => void;
}) {
  const [name, setName] = useState(namePrefill);
  const [description, setDescription] = useState('');
  const [isKnown, setIsKnown] = useState(false);
  const [archetype, setArchetype] = useState<CharacterArchetype | null>('UNKNOWN');

  return (
    <Modal
      visible={true}
      title="Nuevo personaje"
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Añadir a la lista"
      onPrimaryPress={() => {
        const n = name.trim();
        const d = description.trim();
        if (!n || !d) return;
        if (!archetype) return;
        onSubmit({ name: n, description: d, isKnown, archetype });
      }}
    >
      <Input label="Nombre" value={name} onChangeText={setName} />
      <Textarea label="Descripción" value={description} onChangeText={setDescription} />
      <Switch
        label="¿Te es conocido en la vida real?"
        value={isKnown}
        onValueChange={setIsKnown}
      />
      <Select
        label="Arquetipo"
        options={ARCHETYPE_SELECT}
        value={archetype}
        onValueChange={(v) => setArchetype(v as CharacterArchetype)}
        placeholder="Arquetipo"
        modalTitle="Arquetipo"
      />
    </Modal>
  );
}

function LocationCreateModal({
  namePrefill,
  onClose,
  onSubmit,
}: {
  namePrefill: string;
  onClose: () => void;
  onSubmit: (row: {
    name: string;
    description: string;
    isFamiliar: boolean;
    setting: LocationSetting;
  }) => void;
}) {
  const [name, setName] = useState(namePrefill);
  const [description, setDescription] = useState('');
  const [isFamiliar, setIsFamiliar] = useState(false);
  const [setting, setSetting] = useState<LocationSetting | null>('INDOOR');

  return (
    <Modal
      visible={true}
      title="Nuevo lugar"
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Añadir a la lista"
      onPrimaryPress={() => {
        const n = name.trim();
        const d = description.trim();
        if (!n || !d) return;
        if (!setting) return;
        onSubmit({ name: n, description: d, isFamiliar, setting });
      }}
    >
      <Input label="Nombre" value={name} onChangeText={setName} />
      <Textarea label="Descripción" value={description} onChangeText={setDescription} />
      <Switch
        label="¿Te resulta familiar?"
        value={isFamiliar}
        onValueChange={setIsFamiliar}
      />
      <Select
        label="Ambiente"
        options={SETTING_SELECT}
        value={setting}
        onValueChange={(v) => setSetting(v as LocationSetting)}
        placeholder="Ambiente"
        modalTitle="Ambiente"
      />
    </Modal>
  );
}

function ObjectCreateModal({
  namePrefill,
  onClose,
  onSubmit,
}: {
  namePrefill: string;
  onClose: () => void;
  onSubmit: (row: { name: string; description?: string }) => void;
}) {
  const [name, setName] = useState(namePrefill);
  const [description, setDescription] = useState('');

  return (
    <Modal
      visible={true}
      title="Nuevo objeto"
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Añadir a la lista"
      onPrimaryPress={() => {
        const n = name.trim();
        if (!n) return;
        onSubmit({
          name: n,
          description: description.trim() || undefined,
        });
      }}
    >
      <Input label="Nombre" value={name} onChangeText={setName} />
      <Textarea
        label="Descripción (opcional)"
        value={description}
        onChangeText={setDescription}
      />
    </Modal>
  );
}

function EventCreateModal({
  namePrefill,
  onClose,
  onSubmit,
}: {
  namePrefill: string;
  onClose: () => void;
  onSubmit: (row: { label: string; description?: string }) => void;
}) {
  const [label, setLabel] = useState(namePrefill);
  const [description, setDescription] = useState('');

  return (
    <Modal
      visible={true}
      title="Nuevo evento"
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Añadir a la lista"
      onPrimaryPress={() => {
        const n = label.trim();
        if (!n) return;
        onSubmit({
          label: n,
          description: description.trim() || undefined,
        });
      }}
    >
      <Input label="Etiqueta" value={label} onChangeText={setLabel} />
      <Textarea
        label="Descripción (opcional)"
        value={description}
        onChangeText={setDescription}
      />
    </Modal>
  );
}

function ContextCreateModal({
  namePrefill,
  onClose,
  onSubmit,
}: {
  namePrefill: string;
  onClose: () => void;
  onSubmit: (row: { title: string; description?: string }) => void;
}) {
  const [title, setTitle] = useState(namePrefill);
  const [description, setDescription] = useState('');

  return (
    <Modal
      visible={true}
      title="Nuevo contexto vital"
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Añadir a la lista"
      onPrimaryPress={() => {
        const n = title.trim();
        if (!n) return;
        onSubmit({
          title: n,
          description: description.trim() || undefined,
        });
      }}
    >
      <Input label="Título" value={title} onChangeText={setTitle} />
      <Textarea
        label="Descripción (opcional)"
        value={description}
        onChangeText={setDescription}
      />
    </Modal>
  );
}

function FeelingCreateModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (row: {
    kind: FeelingKind;
    intensity?: number;
    notes?: string;
  }) => void;
}) {
  const [kind, setKind] = useState<FeelingKind | null>(null);
  const [useIntensity, setUseIntensity] = useState(false);
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState('');

  return (
    <Modal
      visible={true}
      title="Nuevo sentimiento"
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Añadir a la lista"
      primaryDisabled={!kind}
      onPrimaryPress={() => {
        if (!kind) return;
        onSubmit({
          kind,
          intensity: useIntensity ? intensity : undefined,
          notes: notes.trim() || undefined,
        });
      }}
    >
      <Select
        label="Tipo"
        options={FEELING_SELECT}
        value={kind}
        onValueChange={(v) => setKind(v as FeelingKind)}
        placeholder="Elige una emoción"
        modalTitle="Emoción"
      />
      <Switch
        label="Indicar intensidad (0–10)"
        value={useIntensity}
        onValueChange={setUseIntensity}
      />
      {useIntensity ? (
        <Slider
          label="Intensidad"
          value={intensity}
          onValueChange={setIntensity}
          minimumValue={0}
          maximumValue={10}
          step={1}
        />
      ) : null}
      <Input
        label="Notas (opcional)"
        value={notes}
        onChangeText={setNotes}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 0 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  intro: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  sectionHint: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  loader: { marginVertical: spacing.xs },
  sugBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  sugRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  sugText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  createLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  createLinkText: {
    fontSize: typography.sizes.sm,
    color: colors.accent,
    fontWeight: typography.weights.medium,
  },
  emptyGate: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyGateText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: typography.sizes.md,
  },
});
