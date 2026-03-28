import type {
  CharacterDashboardEntry,
  DreamSession,
  LocationDashboardEntry,
  ObjectDashboardEntry,
} from "@/docs/types";

function normalizeText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function characterGroupKey(c: {
  catalogCharacterId?: string;
  canonicalName: string;
  rawName: string;
}): string {
  if (c.catalogCharacterId) return `id:${c.catalogCharacterId}`;
  const name = normalizeText(c.canonicalName) || normalizeText(c.rawName);
  return `name:${name}`;
}

function characterDisplayName(c: {
  canonicalName: string;
  rawName: string;
}): string {
  const n = c.canonicalName.trim() || c.rawName.trim();
  return n || "Sin nombre";
}

function locationGroupKey(l: {
  setting: string;
  description: string;
}): string {
  return `${l.setting}:${normalizeText(l.description)}`;
}

function locationDisplayLabel(l: { description: string }): string {
  return l.description.trim() || "Sin descripción";
}

function objectGroupKey(o: {
  catalogObjectId?: string;
  label: string;
}): string {
  if (o.catalogObjectId) return `id:${o.catalogObjectId}`;
  return `label:${normalizeText(o.label)}`;
}

function objectDisplayLabel(o: { label: string }): string {
  return o.label.trim() || "Sin etiqueta";
}

/** Agrupa personajes por catálogo o por nombre; cuenta sueños y apariciones. */
export function aggregateCharacters(
  sessions: DreamSession[],
): CharacterDashboardEntry[] {
  const map = new Map<
    string,
    {
      catalogCharacterId?: string;
      displayName: string;
      sessions: Set<string>;
      occurrenceCount: number;
    }
  >();

  for (const session of sessions) {
    for (const seg of session.dreams) {
      const chars = seg.analysis?.entities.characters ?? [];
      for (const c of chars) {
        const key = characterGroupKey(c);
        let row = map.get(key);
        if (!row) {
          row = {
            catalogCharacterId: c.catalogCharacterId,
            displayName: characterDisplayName(c),
            sessions: new Set(),
            occurrenceCount: 0,
          };
          map.set(key, row);
        }
        row.sessions.add(session.id);
        row.occurrenceCount += 1;
      }
    }
  }

  return [...map.entries()].map(([groupKey, row]) => ({
    groupKey,
    catalogCharacterId: row.catalogCharacterId,
    displayName: row.displayName,
    dreamCount: row.sessions.size,
    occurrenceCount: row.occurrenceCount,
  }));
}

/** Agrupa lugares por tipo de escenario + descripción normalizada. */
export function aggregateLocations(
  sessions: DreamSession[],
): LocationDashboardEntry[] {
  const map = new Map<
    string,
    {
      displayLabel: string;
      sessions: Set<string>;
      occurrenceCount: number;
    }
  >();

  for (const session of sessions) {
    for (const seg of session.dreams) {
      const locs = seg.analysis?.entities.locations ?? [];
      for (const l of locs) {
        const key = locationGroupKey(l);
        let row = map.get(key);
        if (!row) {
          row = {
            displayLabel: locationDisplayLabel(l),
            sessions: new Set(),
            occurrenceCount: 0,
          };
          map.set(key, row);
        }
        row.sessions.add(session.id);
        row.occurrenceCount += 1;
      }
    }
  }

  return [...map.entries()].map(([groupKey, row]) => ({
    groupKey,
    displayLabel: row.displayLabel,
    dreamCount: row.sessions.size,
    occurrenceCount: row.occurrenceCount,
  }));
}

/** Agrupa objetos por catálogo o por etiqueta normalizada. */
export function aggregateObjects(
  sessions: DreamSession[],
): ObjectDashboardEntry[] {
  const map = new Map<
    string,
    {
      catalogObjectId?: string;
      displayLabel: string;
      sessions: Set<string>;
      occurrenceCount: number;
    }
  >();

  for (const session of sessions) {
    for (const seg of session.dreams) {
      const objs = seg.analysis?.entities.objects ?? [];
      for (const o of objs) {
        const key = objectGroupKey(o);
        let row = map.get(key);
        if (!row) {
          row = {
            catalogObjectId: o.catalogObjectId,
            displayLabel: objectDisplayLabel(o),
            sessions: new Set(),
            occurrenceCount: 0,
          };
          map.set(key, row);
        }
        row.sessions.add(session.id);
        row.occurrenceCount += 1;
      }
    }
  }

  return [...map.entries()].map(([groupKey, row]) => ({
    groupKey,
    catalogObjectId: row.catalogObjectId,
    displayLabel: row.displayLabel,
    dreamCount: row.sessions.size,
    occurrenceCount: row.occurrenceCount,
  }));
}
