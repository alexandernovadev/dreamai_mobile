import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApiError,
  apiErrorMessage,
  charactersService,
  contextLivesService,
  dreamEventsService,
  dreamObjectsService,
  dreamSessionsService,
  feelingsService,
  locationsService,
} from '@/services';
import { DREAM_LIST_QUERY_PARAMS } from '@/lib/dreamListQuery';
import { queryKeys } from '@/lib/queryKeys';
import type { SignalEntityListSlug } from '@/services/signalEntities';
import { useSuccessBanner } from '@/hooks/useSuccessBanner';
import { newKey } from '@/utils/key';
import { buildRowsFromHydrated } from '../buildRows';
import { invalidateSignalsAfterElementSessionSave } from '../invalidateSignals';
import { mergeCharactersFromAi, mergeEventsFromAi, mergeLocationsFromAi, mergeObjectsFromAi } from '../mergeFromAi';
import type { CharRow, CtxRow, EventRow, FeelingRow, LocRow, ObjRow } from '../types';

export function useElementsState({
  sessionId,
  onError,
  onSaved,
}: {
  sessionId: string;
  onError: (msg: string, kind: 'network' | 'server') => void;
  onSaved?: () => void;
}) {
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const queryClient = useQueryClient();
  const sid = sessionId?.trim() ?? '';

  const hydratedQuery = useQuery({
    queryKey: queryKeys.dreamSessions.hydrated(sid),
    queryFn: () => dreamSessionsService.getHydrated(sid),
    enabled: sid.length > 0,
    refetchOnWindowFocus: false,
  });

  const [characters, setCharacters] = useState<CharRow[]>([]);
  const [locations, setLocations] = useState<LocRow[]>([]);
  const [objects, setObjects] = useState<ObjRow[]>([]);
  const [contextRows, setContextRows] = useState<CtxRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [feelings, setFeelings] = useState<FeelingRow[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { message: successMsg, show: showSuccessBanner } = useSuccessBanner();

  const hydrating =
    hydratedQuery.isPending || (hydratedQuery.isFetching && !hydratedQuery.data);

  // Populate rows from server data
  useLayoutEffect(() => {
    if (!sid) return;
    if (!hydratedQuery.data) {
      setCharacters([]);
      setLocations([]);
      setObjects([]);
      setContextRows([]);
      setEvents([]);
      setFeelings([]);
      return;
    }
    const rows = buildRowsFromHydrated(hydratedQuery.data);
    setCharacters(rows.charRows);
    setLocations(rows.locRows);
    setObjects(rows.objRows);
    setContextRows(rows.ctxRows);
    setEvents(rows.evRows);
    setFeelings(rows.feelRows);
  }, [sid, hydratedQuery.data]);

  // Surface hydration errors
  useEffect(() => {
    if (!hydratedQuery.isError || !hydratedQuery.error) return;
    const msg = apiErrorMessage(hydratedQuery.error);
    const kind =
      hydratedQuery.error instanceof ApiError && hydratedQuery.error.status === 0
        ? 'network'
        : 'server';
    onErrorRef.current(msg, kind);
  }, [hydratedQuery.isError, hydratedQuery.error]);

  const runAiSuggest = useCallback(async () => {
    const s = sessionId?.trim();
    if (!s) return;
    setAiLoading(true);
    try {
      const res = await dreamSessionsService.suggestDreamElements(s);
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

  // Add-from-search callbacks (clear search state in main component via setSuggestions)
  const addChar = useCallback((id: string, name: string) => {
    setCharacters((prev) => {
      if (prev.some((r) => r.t === 'existing' && r.id === id)) return prev;
      return [...prev, { key: newKey(), t: 'existing', id, name }];
    });
  }, []);

  const addLoc = useCallback((id: string, name: string) => {
    setLocations((prev) => {
      if (prev.some((r) => r.t === 'existing' && r.id === id)) return prev;
      return [...prev, { key: newKey(), t: 'existing', id, name }];
    });
  }, []);

  const addObj = useCallback((id: string, name: string) => {
    setObjects((prev) => {
      if (prev.some((r) => r.t === 'existing' && r.id === id)) return prev;
      return [...prev, { key: newKey(), t: 'existing', id, name }];
    });
  }, []);

  const addCtx = useCallback((id: string, title: string) => {
    setContextRows((prev) => {
      if (prev.some((r) => r.t === 'existing' && r.id === id)) return prev;
      return [...prev, { key: newKey(), t: 'existing', id, title }];
    });
  }, []);

  const addEv = useCallback((id: string, label: string) => {
    setEvents((prev) => {
      if (prev.some((r) => r.t === 'existing' && r.id === id)) return prev;
      return [...prev, { key: newKey(), t: 'existing', id, label }];
    });
  }, []);

  const handleSave = async () => {
    if (!sessionId) {
      onError('Falta la sesión de sueño. Guarda el borrador primero.', 'server');
      return;
    }
    setSaving(true);
    try {
      const touchedSignals = new Set<SignalEntityListSlug>();
      const signalDetailPairs: { slug: SignalEntityListSlug; id: string }[] = [];

      const characterIds: string[] = [];
      for (const row of characters) {
        if (row.t === 'existing') {
          characterIds.push(row.id);
        } else {
          const c = await charactersService.create({
            name: row.name.trim(),
            description: row.description.trim(),
            isKnown: row.isKnown,
            archetype: row.archetype,
          });
          characterIds.push(c.id);
          touchedSignals.add('characters');
          signalDetailPairs.push({ slug: 'characters', id: c.id });
        }
      }

      const locationIds: string[] = [];
      for (const row of locations) {
        if (row.t === 'existing') {
          locationIds.push(row.id);
        } else {
          const c = await locationsService.create({
            name: row.name.trim(),
            description: row.description.trim(),
            isFamiliar: row.isFamiliar,
            setting: row.setting,
          });
          locationIds.push(c.id);
          touchedSignals.add('locations');
          signalDetailPairs.push({ slug: 'locations', id: c.id });
        }
      }

      const objectIds: string[] = [];
      for (const row of objects) {
        if (row.t === 'existing') {
          objectIds.push(row.id);
        } else {
          const c = await dreamObjectsService.create({
            name: row.name.trim(),
            description: row.description?.trim() || undefined,
          });
          objectIds.push(c.id);
          touchedSignals.add('objects');
          signalDetailPairs.push({ slug: 'objects', id: c.id });
        }
      }

      const contextLifeIds: string[] = [];
      for (const row of contextRows) {
        if (row.t === 'existing') {
          contextLifeIds.push(row.id);
        } else {
          const c = await contextLivesService.create({
            title: row.title.trim(),
            description: row.description?.trim() || undefined,
          });
          contextLifeIds.push(c.id);
          touchedSignals.add('life-context');
          signalDetailPairs.push({ slug: 'life-context', id: c.id });
        }
      }

      const eventIds: string[] = [];
      for (const row of events) {
        if (row.t === 'existing') {
          eventIds.push(row.id);
        } else {
          const c = await dreamEventsService.create({
            label: row.label.trim(),
            description: row.description?.trim() || undefined,
            dreamSessionId: sessionId,
          });
          eventIds.push(c.id);
          touchedSignals.add('events');
          signalDetailPairs.push({ slug: 'events', id: c.id });
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
        touchedSignals.add('feelings');
        signalDetailPairs.push({ slug: 'feelings', id: feelingIds[feelingIds.length - 1] });
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

      const updated = await dreamSessionsService.update(sessionId, {
        status: 'ELEMENTS',
        analysis: { entities },
      });

      queryClient.setQueryData(queryKeys.dreamSessions.detail(sessionId), updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.dreamSessions.hydrated(sessionId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dreamSessions.list(DREAM_LIST_QUERY_PARAMS) });
      invalidateSignalsAfterElementSessionSave(queryClient, touchedSignals, signalDetailPairs);

      onSaved?.();
      showSuccessBanner('Elementos guardados');
    } catch (e) {
      const msg = apiErrorMessage(e);
      const kind = e instanceof ApiError && e.status === 0 ? 'network' : 'server';
      onError(msg, kind);
    } finally {
      setSaving(false);
    }
  };

  return {
    hydrating,
    characters,
    setCharacters,
    locations,
    setLocations,
    objects,
    setObjects,
    contextRows,
    setContextRows,
    events,
    setEvents,
    feelings,
    setFeelings,
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
  };
}
