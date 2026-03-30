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
  type DreamElementsSuggestResponse,
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
import { SuccessBanner } from '@/components/ui/SuccessBanner';
import { useSuccessBanner } from '@/hooks/useSuccessBanner';
import type { ChipVariant } from '@/components/ui/Chip';
import { colors, radius, spacing, typography } from '@/theme';
import { entityRefId } from '@/utils/entityRef';
import { newKey } from '@/utils/key';


/* TODO Estoy seguri qye este codigo es un esoagitasoo
pero la AI lo hizo, y lo puedo optimizar mas 
*/
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
      /** `ai` = sugerencia aún no guardada; se descarta al volver a pedir IA. */
      source?: 'ai' | 'user';
      emphasizeNew?: boolean;
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
      source?: 'ai' | 'user';
      emphasizeNew?: boolean;
      name: string;
      description: string;
      isFamiliar: boolean;
      setting: LocationSetting;
    };

type ObjRow =
  | { key: string; t: 'existing'; id: string; name: string }
  | {
      key: string;
      t: 'new';
      source?: 'ai' | 'user';
      emphasizeNew?: boolean;
      name: string;
      description?: string;
    };

type CtxRow =
  | { key: string; t: 'existing'; id: string; title: string }
  | {
      key: string;
      t: 'new';
      source?: 'ai' | 'user';
      emphasizeNew?: boolean;
      title: string;
      description?: string;
    };

type EventRow =
  | { key: string; t: 'existing'; id: string; label: string }
  | {
      key: string;
      t: 'new';
      source?: 'ai' | 'user';
      emphasizeNew?: boolean;
      label: string;
      description?: string;
    };

type FeelingRow = {
  key: string;
  /** Presente cuando el sentimiento ya existe en el servidor (hidratar / tras guardar). */
  id?: string;
  kind: FeelingKind;
  intensity?: number;
  notes?: string;
};

type StepModal =
  | { kind: 'character'; mode: 'create'; namePrefill: string }
  | { kind: 'character'; mode: 'edit'; row: CharRow }
  | { kind: 'location'; mode: 'create'; namePrefill: string }
  | { kind: 'location'; mode: 'edit'; row: LocRow }
  | { kind: 'object'; mode: 'create'; namePrefill: string }
  | { kind: 'object'; mode: 'edit'; row: ObjRow }
  | { kind: 'context'; mode: 'create'; namePrefill: string }
  | { kind: 'context'; mode: 'edit'; row: CtxRow }
  | { kind: 'event'; mode: 'create'; namePrefill: string }
  | { kind: 'event'; mode: 'edit'; row: EventRow }
  | { kind: 'feeling'; mode: 'create' }
  | { kind: 'feeling'; mode: 'edit'; row: FeelingRow }
  | null;

type Props = {
  sessionId: string;
  /** Opcional: p. ej. analytics cuando el usuario guarda elementos en el servidor. */
  onSaved?: () => void;
  onError: (message: string, kind: 'network' | 'server') => void;
};

const LOC_SETTINGS: readonly LocationSetting[] = [
  'URBAN',
  'NATURE',
  'INDOOR',
  'ABSTRACT',
];

function coerceLocationSetting(raw: string): LocationSetting {
  const u = raw.trim().toUpperCase();
  return LOC_SETTINGS.includes(u as LocationSetting) ? (u as LocationSetting) : 'ABSTRACT';
}

function mergeCharactersFromAi(
  prev: CharRow[],
  items: DreamElementsSuggestResponse['characters'],
): CharRow[] {
  const base = prev.filter((r) => !(r.t === 'new' && r.source === 'ai'));
  const existingIds = new Set(
    base.filter((r): r is Extract<CharRow, { t: 'existing' }> => r.t === 'existing').map((r) => r.id),
  );
  const out: CharRow[] = [...base];
  for (const item of items) {
    if (item.match) {
      if (!existingIds.has(item.match.catalogId)) {
        existingIds.add(item.match.catalogId);
        out.push({
          key: newKey(),
          t: 'existing',
          id: item.match.catalogId,
          name: item.match.canonicalLabel,
        });
      }
    } else {
      out.push({
        key: newKey(),
        t: 'new',
        source: 'ai',
        emphasizeNew: item.emphasizeNew,
        name: item.fromAi.name,
        description: item.fromAi.description,
        isKnown: item.fromAi.isKnown,
        archetype: item.fromAi.archetype as CharacterArchetype,
      });
    }
  }
  return out;
}

function mergeLocationsFromAi(
  prev: LocRow[],
  items: DreamElementsSuggestResponse['locations'],
): LocRow[] {
  const base = prev.filter((r) => !(r.t === 'new' && r.source === 'ai'));
  const existingIds = new Set(
    base.filter((r): r is Extract<LocRow, { t: 'existing' }> => r.t === 'existing').map((r) => r.id),
  );
  const out: LocRow[] = [...base];
  for (const item of items) {
    if (item.match) {
      if (!existingIds.has(item.match.catalogId)) {
        existingIds.add(item.match.catalogId);
        out.push({
          key: newKey(),
          t: 'existing',
          id: item.match.catalogId,
          name: item.match.canonicalLabel,
        });
      }
    } else {
      out.push({
        key: newKey(),
        t: 'new',
        source: 'ai',
        emphasizeNew: item.emphasizeNew,
        name: item.fromAi.name,
        description: item.fromAi.description,
        isFamiliar: item.fromAi.isFamiliar,
        setting: coerceLocationSetting(item.fromAi.setting),
      });
    }
  }
  return out;
}

function mergeObjectsFromAi(
  prev: ObjRow[],
  items: DreamElementsSuggestResponse['objects'],
): ObjRow[] {
  const base = prev.filter((r) => !(r.t === 'new' && r.source === 'ai'));
  const existingIds = new Set(
    base.filter((r): r is Extract<ObjRow, { t: 'existing' }> => r.t === 'existing').map((r) => r.id),
  );
  const out: ObjRow[] = [...base];
  for (const item of items) {
    if (item.match) {
      if (!existingIds.has(item.match.catalogId)) {
        existingIds.add(item.match.catalogId);
        out.push({
          key: newKey(),
          t: 'existing',
          id: item.match.catalogId,
          name: item.match.canonicalLabel,
        });
      }
    } else {
      out.push({
        key: newKey(),
        t: 'new',
        source: 'ai',
        emphasizeNew: item.emphasizeNew,
        name: item.fromAi.name,
        description: item.fromAi.description?.trim() || undefined,
      });
    }
  }
  return out;
}

function mergeEventsFromAi(
  prev: EventRow[],
  items: DreamElementsSuggestResponse['events'],
): EventRow[] {
  const base = prev.filter((r) => !(r.t === 'new' && r.source === 'ai'));
  const existingIds = new Set(
    base.filter((r): r is Extract<EventRow, { t: 'existing' }> => r.t === 'existing').map((r) => r.id),
  );
  const out: EventRow[] = [...base];
  for (const item of items) {
    if (item.match) {
      if (!existingIds.has(item.match.catalogId)) {
        existingIds.add(item.match.catalogId);
        out.push({
          key: newKey(),
          t: 'existing',
          id: item.match.catalogId,
          label: item.match.canonicalLabel,
        });
      }
    } else {
      out.push({
        key: newKey(),
        t: 'new',
        source: 'ai',
        emphasizeNew: item.emphasizeNew,
        label: item.fromAi.label,
        description: item.fromAi.description?.trim() || undefined,
      });
    }
  }
  return out;
}

export function ElementsStep({ sessionId, onSaved, onError }: Props) {
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const [saving, setSaving] = useState(false);
  const { message: successMsg, show: showSuccessBanner } = useSuccessBanner();

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

  const [stepModal, setStepModal] = useState<StepModal>(null);
  const [hydrating, setHydrating] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const runAiSuggest = useCallback(async () => {
    const sid = sessionId?.trim();
    if (!sid) return;
    setAiLoading(true);
    try {
      const res = await dreamSessionsService.suggestDreamElements(sid);
      setCharacters((p) => mergeCharactersFromAi(p, res.characters));
      setLocations((p) => mergeLocationsFromAi(p, res.locations));
      setObjects((p) => mergeObjectsFromAi(p, res.objects));
      setEvents((p) => mergeEventsFromAi(p, res.events));
    } catch (e) {
      const msg = apiErrorMessage(e);
      const kind = e instanceof ApiError && e.status === 0 ? 'network' : 'server';
      onErrorRef.current(msg, kind);
    } finally {
      setAiLoading(false);
    }
  }, [sessionId]);

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
                id: x.id,
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
      const nextFeelings: FeelingRow[] = [];
      for (const row of feelings) {
        if (row.id) {
          await feelingsService.update(row.id, {
            kind: row.kind,
            dreamSessionId: sessionId,
            intensity: row.intensity,
            notes: row.notes?.trim() || undefined,
          });
          feelingIds.push(row.id);
          nextFeelings.push(row);
        } else {
          const c = await feelingsService.create({
            kind: row.kind,
            dreamSessionId: sessionId,
            intensity: row.intensity,
            notes: row.notes?.trim() || undefined,
          });
          feelingIds.push(c.id);
          nextFeelings.push({ ...row, id: c.id });
        }
      }
      setFeelings(nextFeelings);

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
      showSuccessBanner('Elementos guardados');
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
          todo se guardará en el servidor al pulsar Guardar. Puedes pedir sugerencias desde la
          narrativa: no sustituyen lo que ya guardaste; volver a pedir IA quita solo el último lote de
          sugerencias aún no guardadas.
        </Text>

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
            setStepModal({ kind: 'character', mode: 'create', namePrefill: qChar.trim() })
          }
          entries={characters.map((r) => ({
            key: r.key,
            label:
              r.t === 'existing'
                ? r.name
                : `${r.name}${r.source === 'ai' ? ' · IA' : ''}${r.emphasizeNew ? ' ✦' : ''} (nuevo)`,
            chipVariant: r.t === 'new' && r.emphasizeNew ? 'yellow' : undefined,
            onEdit: () => setStepModal({ kind: 'character', mode: 'edit', row: r }),
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
            setStepModal({ kind: 'location', mode: 'create', namePrefill: qLoc.trim() })
          }
          entries={locations.map((r) => ({
            key: r.key,
            label:
              r.t === 'existing'
                ? r.name
                : `${r.name}${r.source === 'ai' ? ' · IA' : ''}${r.emphasizeNew ? ' ✦' : ''} (nuevo)`,
            chipVariant: r.t === 'new' && r.emphasizeNew ? 'yellow' : undefined,
            onEdit: () => setStepModal({ kind: 'location', mode: 'edit', row: r }),
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
            setStepModal({ kind: 'object', mode: 'create', namePrefill: qObj.trim() })
          }
          entries={objects.map((r) => ({
            key: r.key,
            label:
              r.t === 'existing'
                ? r.name
                : `${r.name}${r.source === 'ai' ? ' · IA' : ''}${r.emphasizeNew ? ' ✦' : ''} (nuevo)`,
            chipVariant: r.t === 'new' && r.emphasizeNew ? 'yellow' : undefined,
            onEdit: () => setStepModal({ kind: 'object', mode: 'edit', row: r }),
          }))}
          onRemove={(key) => setObjects((p) => p.filter((r) => r.key !== key))}
        />

        <SearchBlock
          title="Contexto de la vida real"
          chipVariant="teal"
          placeholder="Buscar por título…"
          query={qCtx}
          onQueryChange={setQCtx}
          suggestions={sugCtx}
          loading={loadCtx}
          onPick={addCtx}
          onCreate={() =>
            setStepModal({ kind: 'context', mode: 'create', namePrefill: qCtx.trim() })
          }
          entries={contextRows.map((r) => ({
            key: r.key,
            label:
              r.t === 'existing'
                ? r.title
                : `${r.title}${r.source === 'ai' ? ' · IA' : ''}${r.emphasizeNew ? ' ✦' : ''} (nuevo)`,
            chipVariant: r.t === 'new' && r.emphasizeNew ? 'yellow' : undefined,
            onEdit: () => setStepModal({ kind: 'context', mode: 'edit', row: r }),
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
            setStepModal({ kind: 'event', mode: 'create', namePrefill: qEv.trim() })
          }
          entries={events.map((r) => ({
            key: r.key,
            label:
              r.t === 'existing'
                ? r.label
                : `${r.label}${r.source === 'ai' ? ' · IA' : ''}${r.emphasizeNew ? ' ✦' : ''} (nuevo)`,
            chipVariant: r.t === 'new' && r.emphasizeNew ? 'yellow' : undefined,
            onEdit: () => setStepModal({ kind: 'event', mode: 'edit', row: r }),
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
          setStepModal(null);
        }}
        onUpdateCharacter={(next) =>
          setCharacters((p) =>
            p.map((r) => {
              if (r.key !== next.key) return r;
              if (next.t === 'new') {
                return { ...next, source: 'user' as const };
              }
              return next;
            }),
          )
        }
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
          setStepModal(null);
        }}
        onUpdateLocation={(next) =>
          setLocations((p) =>
            p.map((r) => {
              if (r.key !== next.key) return r;
              if (next.t === 'new') {
                return { ...next, source: 'user' as const };
              }
              return next;
            }),
          )
        }
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
          setStepModal(null);
        }}
        onUpdateObject={(next) =>
          setObjects((p) =>
            p.map((r) => {
              if (r.key !== next.key) return r;
              if (next.t === 'new') {
                return { ...next, source: 'user' as const };
              }
              return next;
            }),
          )
        }
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
          setStepModal(null);
        }}
        onUpdateEvent={(next) =>
          setEvents((p) =>
            p.map((r) => {
              if (r.key !== next.key) return r;
              if (next.t === 'new') {
                return { ...next, source: 'user' as const };
              }
              return next;
            }),
          )
        }
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
          setStepModal(null);
        }}
        onUpdateContext={(next) =>
          setContextRows((p) =>
            p.map((r) => {
              if (r.key !== next.key) return r;
              if (next.t === 'new') {
                return { ...next, source: 'user' as const };
              }
              return next;
            }),
          )
        }
        onAddFeeling={(row) => {
          setFeelings((p) => [...p, { key: newKey(), ...row }]);
          setStepModal(null);
        }}
        onUpdateFeeling={(next) =>
          setFeelings((p) => p.map((r) => (r.key === next.key ? next : r)))
        }
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
  entries: {
    key: string;
    label: string;
    onEdit?: () => void;
    chipVariant?: ChipVariant;
  }[];
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
            variant={e.chipVariant ?? chipVariant}
            onEdit={e.onEdit}
            onRemove={() => onRemove(e.key)}
          />
        ))}
      </View>
    </View>
  );
}

function StepModals(props: {
  modal: StepModal;
  sessionId: string;
  onClose: () => void;
  onError: (message: string, kind: 'network' | 'server') => void;
  onAddCharacter: (row: {
    name: string;
    description: string;
    isKnown: boolean;
    archetype: CharacterArchetype;
  }) => void;
  onUpdateCharacter: (next: CharRow) => void;
  onAddLocation: (row: {
    name: string;
    description: string;
    isFamiliar: boolean;
    setting: LocationSetting;
  }) => void;
  onUpdateLocation: (next: LocRow) => void;
  onAddObject: (row: { name: string; description?: string }) => void;
  onUpdateObject: (next: ObjRow) => void;
  onAddEvent: (row: { label: string; description?: string }) => void;
  onUpdateEvent: (next: EventRow) => void;
  onAddContext: (row: { title: string; description?: string }) => void;
  onUpdateContext: (next: CtxRow) => void;
  onAddFeeling: (row: {
    kind: FeelingKind;
    intensity?: number;
    notes?: string;
  }) => void;
  onUpdateFeeling: (next: FeelingRow) => void;
}) {
  const {
    modal,
    sessionId,
    onClose,
    onError,
    onAddCharacter,
    onUpdateCharacter,
    onAddLocation,
    onUpdateLocation,
    onAddObject,
    onUpdateObject,
    onAddEvent,
    onUpdateEvent,
    onAddContext,
    onUpdateContext,
    onAddFeeling,
    onUpdateFeeling,
  } = props;

  const reportErr = useCallback(
    (e: unknown) => {
      const msg = apiErrorMessage(e);
      const kind = e instanceof ApiError && e.status === 0 ? 'network' : 'server';
      onError(msg, kind);
    },
    [onError],
  );

  if (!modal) return null;

  if (modal.kind === 'character') {
    if (modal.mode === 'create') {
      return (
        <CharacterCreateModal
          key={`char-${modal.namePrefill}`}
          namePrefill={modal.namePrefill}
          onClose={onClose}
          onSubmit={onAddCharacter}
        />
      );
    }
    return (
      <CharacterEditModal
        key={`echar-${modal.row.key}`}
        row={modal.row}
        onClose={onClose}
        onApplied={onUpdateCharacter}
        onApiError={reportErr}
      />
    );
  }
  if (modal.kind === 'location') {
    if (modal.mode === 'create') {
      return (
        <LocationCreateModal
          key={`loc-${modal.namePrefill}`}
          namePrefill={modal.namePrefill}
          onClose={onClose}
          onSubmit={onAddLocation}
        />
      );
    }
    return (
      <LocationEditModal
        key={`eloc-${modal.row.key}`}
        row={modal.row}
        onClose={onClose}
        onApplied={onUpdateLocation}
        onApiError={reportErr}
      />
    );
  }
  if (modal.kind === 'object') {
    if (modal.mode === 'create') {
      return (
        <ObjectCreateModal
          key={`obj-${modal.namePrefill}`}
          namePrefill={modal.namePrefill}
          onClose={onClose}
          onSubmit={onAddObject}
        />
      );
    }
    return (
      <ObjectEditModal
        key={`eobj-${modal.row.key}`}
        row={modal.row}
        onClose={onClose}
        onApplied={onUpdateObject}
        onApiError={reportErr}
      />
    );
  }
  if (modal.kind === 'event') {
    if (modal.mode === 'create') {
      return (
        <EventCreateModal
          key={`ev-${modal.namePrefill}`}
          namePrefill={modal.namePrefill}
          onClose={onClose}
          onSubmit={onAddEvent}
        />
      );
    }
    return (
      <EventEditModal
        key={`eev-${modal.row.key}`}
        row={modal.row}
        sessionId={sessionId}
        onClose={onClose}
        onApplied={onUpdateEvent}
        onApiError={reportErr}
      />
    );
  }
  if (modal.kind === 'context') {
    if (modal.mode === 'create') {
      return (
        <ContextCreateModal
          key={`ctx-${modal.namePrefill}`}
          namePrefill={modal.namePrefill}
          onClose={onClose}
          onSubmit={onAddContext}
        />
      );
    }
    return (
      <ContextEditModal
        key={`ectx-${modal.row.key}`}
        row={modal.row}
        onClose={onClose}
        onApplied={onUpdateContext}
        onApiError={reportErr}
      />
    );
  }
  if (modal.kind === 'feeling') {
    if (modal.mode === 'create') {
      return (
        <FeelingCreateModal key="feeling-new" onClose={onClose} onSubmit={onAddFeeling} />
      );
    }
    return (
      <FeelingEditModal
        key={`efeel-${modal.row.key}`}
        row={modal.row}
        sessionId={sessionId}
        onClose={onClose}
        onApplied={onUpdateFeeling}
        onApiError={reportErr}
      />
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

function CharacterEditModal({
  row,
  onClose,
  onApplied,
  onApiError,
}: {
  row: CharRow;
  onClose: () => void;
  onApplied: (next: CharRow) => void;
  onApiError: (e: unknown) => void;
}) {
  const [loading, setLoading] = useState(row.t === 'existing');
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isKnown, setIsKnown] = useState(false);
  const [archetype, setArchetype] = useState<CharacterArchetype | null>(null);

  useEffect(() => {
    if (row.t === 'new') {
      setName(row.name);
      setDescription(row.description);
      setIsKnown(row.isKnown);
      setArchetype(row.archetype);
      setLoading(false);
      return;
    }
    let cancelled = false;
    void charactersService
      .getOne(row.id)
      .then((c) => {
        if (cancelled) return;
        setName(c.name);
        setDescription(c.description);
        setIsKnown(c.isKnown);
        setArchetype(c.archetype);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        onApiError(e);
        onClose();
      });
    return () => {
      cancelled = true;
    };
  }, [row, onApiError, onClose]);

  const save = async () => {
    const n = name.trim();
    const d = description.trim();
    if (!n || !d || !archetype) return;
    if (row.t === 'existing') {
      setSaving(true);
      try {
        await charactersService.update(row.id, {
          name: n,
          description: d,
          isKnown,
          archetype,
        });
        onApplied({ key: row.key, t: 'existing', id: row.id, name: n });
        onClose();
      } catch (e) {
        onApiError(e);
      } finally {
        setSaving(false);
      }
    } else {
      onApplied({
        key: row.key,
        t: 'new',
        name: n,
        description: d,
        isKnown,
        archetype,
      });
      onClose();
    }
  };

  return (
    <Modal
      visible={true}
      title={row.t === 'existing' ? 'Editar personaje' : 'Editar borrador (personaje)'}
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Guardar"
      primaryDisabled={loading || saving || !archetype}
      onPrimaryPress={() => void save()}
    >
      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <>
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
        </>
      )}
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

function LocationEditModal({
  row,
  onClose,
  onApplied,
  onApiError,
}: {
  row: LocRow;
  onClose: () => void;
  onApplied: (next: LocRow) => void;
  onApiError: (e: unknown) => void;
}) {
  const [loading, setLoading] = useState(row.t === 'existing');
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isFamiliar, setIsFamiliar] = useState(false);
  const [setting, setSetting] = useState<LocationSetting | null>(null);

  useEffect(() => {
    if (row.t === 'new') {
      setName(row.name);
      setDescription(row.description);
      setIsFamiliar(row.isFamiliar);
      setSetting(row.setting);
      setLoading(false);
      return;
    }
    let cancelled = false;
    void locationsService
      .getOne(row.id)
      .then((x) => {
        if (cancelled) return;
        setName(x.name);
        setDescription(x.description);
        setIsFamiliar(x.isFamiliar);
        setSetting(x.setting);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        onApiError(e);
        onClose();
      });
    return () => {
      cancelled = true;
    };
  }, [row, onApiError, onClose]);

  const save = async () => {
    const n = name.trim();
    const d = description.trim();
    if (!n || !d || !setting) return;
    if (row.t === 'existing') {
      setSaving(true);
      try {
        await locationsService.update(row.id, {
          name: n,
          description: d,
          isFamiliar,
          setting,
        });
        onApplied({ key: row.key, t: 'existing', id: row.id, name: n });
        onClose();
      } catch (e) {
        onApiError(e);
      } finally {
        setSaving(false);
      }
    } else {
      onApplied({
        key: row.key,
        t: 'new',
        name: n,
        description: d,
        isFamiliar,
        setting,
      });
      onClose();
    }
  };

  return (
    <Modal
      visible={true}
      title={row.t === 'existing' ? 'Editar lugar' : 'Editar borrador (lugar)'}
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Guardar"
      primaryDisabled={loading || saving || !setting}
      onPrimaryPress={() => void save()}
    >
      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <>
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
        </>
      )}
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

function ObjectEditModal({
  row,
  onClose,
  onApplied,
  onApiError,
}: {
  row: ObjRow;
  onClose: () => void;
  onApplied: (next: ObjRow) => void;
  onApiError: (e: unknown) => void;
}) {
  const [loading, setLoading] = useState(row.t === 'existing');
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (row.t === 'new') {
      setName(row.name);
      setDescription(row.description ?? '');
      setLoading(false);
      return;
    }
    let cancelled = false;
    void dreamObjectsService
      .getOne(row.id)
      .then((x) => {
        if (cancelled) return;
        setName(x.name);
        setDescription(x.description ?? '');
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        onApiError(e);
        onClose();
      });
    return () => {
      cancelled = true;
    };
  }, [row, onApiError, onClose]);

  const save = async () => {
    const n = name.trim();
    if (!n) return;
    const d = description.trim() || undefined;
    if (row.t === 'existing') {
      setSaving(true);
      try {
        await dreamObjectsService.update(row.id, { name: n, description: d });
        onApplied({ key: row.key, t: 'existing', id: row.id, name: n });
        onClose();
      } catch (e) {
        onApiError(e);
      } finally {
        setSaving(false);
      }
    } else {
      onApplied({ key: row.key, t: 'new', name: n, description: d });
      onClose();
    }
  };

  return (
    <Modal
      visible={true}
      title={row.t === 'existing' ? 'Editar objeto' : 'Editar borrador (objeto)'}
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Guardar"
      primaryDisabled={loading || saving}
      onPrimaryPress={() => void save()}
    >
      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <>
          <Input label="Nombre" value={name} onChangeText={setName} />
          <Textarea
            label="Descripción (opcional)"
            value={description}
            onChangeText={setDescription}
          />
        </>
      )}
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

function EventEditModal({
  row,
  sessionId,
  onClose,
  onApplied,
  onApiError,
}: {
  row: EventRow;
  sessionId: string;
  onClose: () => void;
  onApplied: (next: EventRow) => void;
  onApiError: (e: unknown) => void;
}) {
  const [loading, setLoading] = useState(row.t === 'existing');
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (row.t === 'new') {
      setLabel(row.label);
      setDescription(row.description ?? '');
      setLoading(false);
      return;
    }
    let cancelled = false;
    void dreamEventsService
      .getOne(row.id)
      .then((x) => {
        if (cancelled) return;
        setLabel(x.label);
        setDescription(x.description ?? '');
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        onApiError(e);
        onClose();
      });
    return () => {
      cancelled = true;
    };
  }, [row, onApiError, onClose]);

  const save = async () => {
    const n = label.trim();
    if (!n) return;
    const d = description.trim() || undefined;
    if (row.t === 'existing') {
      setSaving(true);
      try {
        await dreamEventsService.update(row.id, {
          label: n,
          description: d,
          dreamSessionId: sessionId,
        });
        onApplied({ key: row.key, t: 'existing', id: row.id, label: n });
        onClose();
      } catch (e) {
        onApiError(e);
      } finally {
        setSaving(false);
      }
    } else {
      onApplied({ key: row.key, t: 'new', label: n, description: d });
      onClose();
    }
  };

  return (
    <Modal
      visible={true}
      title={row.t === 'existing' ? 'Editar evento' : 'Editar borrador (evento)'}
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Guardar"
      primaryDisabled={loading || saving}
      onPrimaryPress={() => void save()}
    >
      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <>
          <Input label="Etiqueta" value={label} onChangeText={setLabel} />
          <Textarea
            label="Descripción (opcional)"
            value={description}
            onChangeText={setDescription}
          />
        </>
      )}
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
      title="Nuevo contexto de la vida real"
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

function ContextEditModal({
  row,
  onClose,
  onApplied,
  onApiError,
}: {
  row: CtxRow;
  onClose: () => void;
  onApplied: (next: CtxRow) => void;
  onApiError: (e: unknown) => void;
}) {
  const [loading, setLoading] = useState(row.t === 'existing');
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (row.t === 'new') {
      setTitle(row.title);
      setDescription(row.description ?? '');
      setLoading(false);
      return;
    }
    let cancelled = false;
    void contextLivesService
      .getOne(row.id)
      .then((x) => {
        if (cancelled) return;
        setTitle(x.title);
        setDescription(x.description ?? '');
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        onApiError(e);
        onClose();
      });
    return () => {
      cancelled = true;
    };
  }, [row, onApiError, onClose]);

  const save = async () => {
    const n = title.trim();
    if (!n) return;
    const d = description.trim() || undefined;
    if (row.t === 'existing') {
      setSaving(true);
      try {
        await contextLivesService.update(row.id, { title: n, description: d });
        onApplied({ key: row.key, t: 'existing', id: row.id, title: n });
        onClose();
      } catch (e) {
        onApiError(e);
      } finally {
        setSaving(false);
      }
    } else {
      onApplied({ key: row.key, t: 'new', title: n, description: d });
      onClose();
    }
  };

  return (
    <Modal
      visible={true}
      title={
        row.t === 'existing'
          ? 'Editar contexto de la vida real'
          : 'Editar borrador (contexto de la vida real)'
      }
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Guardar"
      primaryDisabled={loading || saving}
      onPrimaryPress={() => void save()}
    >
      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : (
        <>
          <Input label="Título" value={title} onChangeText={setTitle} />
          <Textarea
            label="Descripción (opcional)"
            value={description}
            onChangeText={setDescription}
          />
        </>
      )}
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

function FeelingEditModal({
  row,
  sessionId,
  onClose,
  onApplied,
  onApiError,
}: {
  row: FeelingRow;
  sessionId: string;
  onClose: () => void;
  onApplied: (next: FeelingRow) => void;
  onApiError: (e: unknown) => void;
}) {
  const [kind, setKind] = useState<FeelingKind | null>(row.kind);
  const [useIntensity, setUseIntensity] = useState(row.intensity != null);
  const [intensity, setIntensity] = useState(row.intensity ?? 5);
  const [notes, setNotes] = useState(row.notes ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!kind) return;
    const payload = {
      kind,
      intensity: useIntensity ? intensity : undefined,
      notes: notes.trim() || undefined,
    };
    if (row.id) {
      setSaving(true);
      try {
        await feelingsService.update(row.id, {
          kind: payload.kind,
          dreamSessionId: sessionId,
          intensity: payload.intensity,
          notes: payload.notes,
        });
        onApplied({ ...row, ...payload });
        onClose();
      } catch (e) {
        onApiError(e);
      } finally {
        setSaving(false);
      }
    } else {
      onApplied({ ...row, ...payload });
      onClose();
    }
  };

  return (
    <Modal
      visible={true}
      title="Editar sentimiento"
      onClose={onClose}
      closeLabel="Cancelar"
      primaryLabel="Guardar"
      primaryDisabled={!kind || saving}
      onPrimaryPress={() => void save()}
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
  aiRow: {
    alignSelf: 'flex-start',
  },
  saveBlock: {
    gap: spacing.md,
  },
});
