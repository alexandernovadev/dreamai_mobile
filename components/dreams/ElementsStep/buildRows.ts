import type { DreamSessionHydratedResponse } from '@/services/dreamSessions';
import { entityRefId } from '@/utils/entityRef';
import { newKey } from '@/utils/key';
import type { CharRow, CtxRow, EventRow, FeelingRow, LocRow, ObjRow } from './types';

export function buildRowsFromHydrated({
  session,
  hydrated,
}: DreamSessionHydratedResponse): {
  charRows: CharRow[];
  locRows: LocRow[];
  objRows: ObjRow[];
  ctxRows: CtxRow[];
  evRows: EventRow[];
  feelRows: FeelingRow[];
} {
  const entities = session.analysis?.entities;
  if (!entities) {
    return { charRows: [], locRows: [], objRows: [], ctxRows: [], evRows: [], feelRows: [] };
  }

  const charRows: CharRow[] = [];
  for (const r of entities.characters ?? []) {
    const id = entityRefId(r.characterId);
    if (!id) continue;
    const c = hydrated.characters[id];
    if (c) charRows.push({ key: newKey(), t: 'existing', id: c.id, name: c.name });
  }

  const locRows: LocRow[] = [];
  for (const r of entities.locations ?? []) {
    const id = entityRefId(r.locationId);
    if (!id) continue;
    const x = hydrated.locations[id];
    if (x) locRows.push({ key: newKey(), t: 'existing', id: x.id, name: x.name });
  }

  const objRows: ObjRow[] = [];
  for (const r of entities.objects ?? []) {
    const id = entityRefId(r.objectId);
    if (!id) continue;
    const x = hydrated.objects[id];
    if (x) objRows.push({ key: newKey(), t: 'existing', id: x.id, name: x.name });
  }

  const ctxRows: CtxRow[] = [];
  for (const r of entities.contextLife ?? []) {
    const id = entityRefId(r.contextLifeId);
    if (!id) continue;
    const x = hydrated.contextLife[id];
    if (x) ctxRows.push({ key: newKey(), t: 'existing', id: x.id, title: x.title });
  }

  const evRows: EventRow[] = [];
  for (const r of entities.events ?? []) {
    const id = entityRefId(r.eventId);
    if (!id) continue;
    const x = hydrated.events[id];
    if (x) evRows.push({ key: newKey(), t: 'existing', id: x.id, label: x.label });
  }

  const feelRows: FeelingRow[] = [];
  for (const r of entities.feelings ?? []) {
    const id = entityRefId(r.feelingId);
    if (!id) continue;
    const x = hydrated.feelings[id];
    if (x) {
      feelRows.push({
        key: newKey(),
        id: x.id,
        kind: x.kind as FeelingRow['kind'],
        intensity: x.intensity,
        notes: x.notes,
      });
    }
  }

  return { charRows, locRows, objRows, ctxRows, evRows, feelRows };
}
