import type { EntityKind } from '../../ui/dream/entity-kind';
import { FEELING_KIND_LABEL, type FeelingKind } from '../models/catalog.model';

/** The real backend field that holds each entity kind's display name.
 * `feelings` has none — its identity is the `kind` enum, handled separately. */
export const ENTITY_PRIMARY_FIELD: Partial<Record<EntityKind, string>> = {
  characters: 'name',
  locations: 'name',
  objects: 'name',
  events: 'label',
  'life-context': 'title',
};

/** Extracts a human label from a catalog row regardless of kind — used
 * anywhere a search result, hydrated ref, or list row needs a display name
 * (DreamEditor's inline attach/create, DreamView, the Signals list/hub). */
export function entityLabelOf(kind: EntityKind, row: Record<string, unknown>): string {
  if (kind === 'feelings') {
    const k = row['kind'] as FeelingKind | undefined;
    return k ? (FEELING_KIND_LABEL[k] ?? k) : '';
  }
  const field = ENTITY_PRIMARY_FIELD[kind];
  return field ? String(row[field] ?? '') : '';
}
