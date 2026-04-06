import type { DreamElementsSuggestResponse } from '@/services';
import type { CharacterArchetype, LocationSetting } from '@/services';
import { newKey } from '@/utils/key';
import type { CharRow, EventRow, LocRow, ObjRow } from './types';

const LOC_SETTINGS: readonly LocationSetting[] = ['URBAN', 'NATURE', 'INDOOR', 'ABSTRACT'];

function coerceLocationSetting(raw: string): LocationSetting {
  const u = raw.trim().toUpperCase();
  return LOC_SETTINGS.includes(u as LocationSetting) ? (u as LocationSetting) : 'ABSTRACT';
}

/** Merge helper: drops previous AI suggestions, keeps user rows, appends new AI results. */
function mergeBase<TRow extends { key: string; t: 'existing' | 'new'; source?: 'ai' | 'user' }>(
  prev: TRow[],
): { base: TRow[]; existingIds: Set<string> } {
  const base = prev.filter((r) => !(r.t === 'new' && r.source === 'ai'));
  const existingIds = new Set(
    base
      .filter((r): r is Extract<TRow, { t: 'existing' }> => r.t === 'existing')
      .map((r) => (r as unknown as { id: string }).id),
  );
  return { base, existingIds };
}

export function mergeCharactersFromAi(
  prev: CharRow[],
  items: DreamElementsSuggestResponse['characters'],
): CharRow[] {
  const { base, existingIds } = mergeBase(prev);
  const out: CharRow[] = [...base];
  for (const item of items) {
    if (item.match) {
      if (!existingIds.has(item.match.catalogId)) {
        existingIds.add(item.match.catalogId);
        out.push({ key: newKey(), t: 'existing', id: item.match.catalogId, name: item.match.canonicalLabel });
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

export function mergeLocationsFromAi(
  prev: LocRow[],
  items: DreamElementsSuggestResponse['locations'],
): LocRow[] {
  const { base, existingIds } = mergeBase(prev);
  const out: LocRow[] = [...base];
  for (const item of items) {
    if (item.match) {
      if (!existingIds.has(item.match.catalogId)) {
        existingIds.add(item.match.catalogId);
        out.push({ key: newKey(), t: 'existing', id: item.match.catalogId, name: item.match.canonicalLabel });
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

export function mergeObjectsFromAi(
  prev: ObjRow[],
  items: DreamElementsSuggestResponse['objects'],
): ObjRow[] {
  const { base, existingIds } = mergeBase(prev);
  const out: ObjRow[] = [...base];
  for (const item of items) {
    if (item.match) {
      if (!existingIds.has(item.match.catalogId)) {
        existingIds.add(item.match.catalogId);
        out.push({ key: newKey(), t: 'existing', id: item.match.catalogId, name: item.match.canonicalLabel });
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

export function mergeEventsFromAi(
  prev: EventRow[],
  items: DreamElementsSuggestResponse['events'],
): EventRow[] {
  const { base, existingIds } = mergeBase(prev);
  const out: EventRow[] = [...base];
  for (const item of items) {
    if (item.match) {
      if (!existingIds.has(item.match.catalogId)) {
        existingIds.add(item.match.catalogId);
        out.push({ key: newKey(), t: 'existing', id: item.match.catalogId, label: item.match.canonicalLabel });
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
