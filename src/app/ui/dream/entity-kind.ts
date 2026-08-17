/** The 6 catalog entity types a dream session can reference. Mirrors
 * dreamai_app's SignalEntityListSlug — keep in sync with the backend catalogs. */
export type EntityKind =
  | 'characters'
  | 'locations'
  | 'objects'
  | 'events'
  | 'life-context'
  | 'feelings';

export const ENTITY_LABEL: Record<EntityKind, string> = {
  characters: 'Personajes',
  locations: 'Lugares',
  objects: 'Objetos',
  events: 'Eventos',
  'life-context': 'Contexto de vida',
  feelings: 'Sentimientos',
};

export const ENTITY_KINDS: EntityKind[] = [
  'characters',
  'locations',
  'objects',
  'events',
  'life-context',
  'feelings',
];

/** Frontend `EntityKind` slugs vs. backend `@Controller()` paths — they diverge
 * for 2 of the 6 types, so this map must be used rather than the raw kind. */
export const ENTITY_KIND_TO_API_PATH: Record<EntityKind, string> = {
  characters: 'characters',
  locations: 'locations',
  objects: 'dream-objects',
  events: 'dream-events',
  'life-context': 'context-life',
  feelings: 'feelings',
};

/** Event/Feeling rows always belong to a dream session — they can't be
 * created standalone from a catalog management screen (hard backend
 * constraint: `dreamSessionId` is `@Prop({ required: true })`). */
export const ENTITY_KIND_REQUIRES_DREAM_SESSION: Record<EntityKind, boolean> = {
  characters: false,
  locations: false,
  objects: false,
  events: true,
  'life-context': false,
  feelings: true,
};

/** Backend search query param per kind (`?name=`/`?label=`/`?title=`) — only
 * present for kinds that have a free-text field to search by. `feelings` has
 * none (identity field is the closed `kind` enum, not text). `events` DOES
 * have `label`, but is deliberately excluded here: `DreamEvent.dreamSessionId`
 * is a required, fixed relation — an event can't be reused across dreams, so
 * "search existing events" isn't a meaningful action outside its own session. */
export const ENTITY_KIND_SEARCH_PARAM: Partial<Record<EntityKind, string>> = {
  characters: 'name',
  locations: 'name',
  objects: 'name',
  'life-context': 'title',
};

// ── Generic entity form field config ────────────────────────────────────
//
// Declarative, per-kind field list that `EntityForm` renders — this is what
// replaces dreamai_app's 6 near-duplicate modal files (ElementsStep/modals/)
// and its 6 near-duplicate inline JSX blocks (signals/[entity]/[id]/edit.tsx)
// with one component. Keys are the REAL backend field names (name/label/title
// differ per type) — no normalization layer, so there's nothing to translate
// wrong at the API boundary.

import type { SelectOption } from '../select/select';
import {
  CHARACTER_ARCHETYPE_LABEL,
  LOCATION_SETTING_LABEL,
  FEELING_KIND_LABEL,
} from '../../core/models/catalog.model';

function toOptions(labels: Record<string, string>): SelectOption[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}

export type EntityFieldType =
  | 'text'
  | 'textarea'
  | 'switch'
  | 'select'
  | 'slider'
  | 'image';

export interface EntityFieldConfig {
  key: string;
  type: EntityFieldType;
  label: string;
  required?: boolean;
  options?: SelectOption[];
  min?: number;
  max?: number;
}

export const ENTITY_FIELD_CONFIG: Record<EntityKind, EntityFieldConfig[]> = {
  characters: [
    { key: 'name', type: 'text', label: 'Nombre', required: true },
    {
      key: 'description',
      type: 'textarea',
      label: 'Descripción',
      required: true,
    },
    { key: 'isKnown', type: 'switch', label: '¿La conocés en la vida real?' },
    {
      key: 'archetype',
      type: 'select',
      label: 'Arquetipo',
      required: true,
      options: toOptions(CHARACTER_ARCHETYPE_LABEL),
    },
    { key: 'imageUri', type: 'image', label: 'Imagen' },
  ],
  locations: [
    { key: 'name', type: 'text', label: 'Nombre', required: true },
    {
      key: 'description',
      type: 'textarea',
      label: 'Descripción',
      required: true,
    },
    { key: 'isFamiliar', type: 'switch', label: '¿Te resulta familiar?' },
    {
      key: 'setting',
      type: 'select',
      label: 'Entorno',
      required: true,
      options: toOptions(LOCATION_SETTING_LABEL),
    },
    { key: 'imageUri', type: 'image', label: 'Imagen' },
  ],
  objects: [
    { key: 'name', type: 'text', label: 'Nombre', required: true },
    { key: 'description', type: 'textarea', label: 'Descripción' },
    { key: 'imageUri', type: 'image', label: 'Imagen' },
  ],
  events: [
    { key: 'label', type: 'text', label: 'Evento', required: true },
    { key: 'description', type: 'textarea', label: 'Descripción' },
  ],
  feelings: [
    {
      key: 'kind',
      type: 'select',
      label: 'Sentimiento',
      required: true,
      options: toOptions(FEELING_KIND_LABEL),
    },
    { key: 'intensity', type: 'slider', label: 'Intensidad', min: 0, max: 10 },
    { key: 'notes', type: 'textarea', label: 'Notas' },
  ],
  'life-context': [
    { key: 'title', type: 'text', label: 'Título', required: true },
    { key: 'description', type: 'textarea', label: 'Descripción' },
  ],
};
