// Mirrors dreamia_back/src/dream-session/schemas/dream-session.schema.ts and
// dto/*.ts field-for-field. `status` is decided by the client and sent on
// every PATCH — the server only enforces a monotonic max, never regresses it
// (see dream-session-status.util.ts). No wizard/step concept exists server-side.

export type DreamSessionStatus = 'DRAFT' | 'ELEMENTS' | 'STRUCTURED' | 'THOUGHT';

export type DreamPerspective = 'ACTOR' | 'OBSERVER';

export const DREAM_PERSPECTIVE_LABEL: Record<DreamPerspective, string> = {
  ACTOR: 'Actor',
  OBSERVER: 'Observador',
};

// Ref shapes match the exact per-type key the backend expects
// (dream-entities-input.dto.ts) — not a generic `{ id }`.
export interface DreamEntities {
  characters: { characterId: string }[];
  locations: { locationId: string }[];
  objects: { objectId: string }[];
  events: { eventId: string }[];
  contextLife: { contextLifeId: string }[];
  feelings: { feelingId: string }[];
}

export interface DreamAnalysis {
  perspectives?: DreamPerspective[];
  lucidityLevel?: number;
  entities?: DreamEntities;
}

export interface DreamSession {
  id: string;
  timestamp?: string;
  status: DreamSessionStatus;
  rawNarrative: string;
  dreamKind: string[];
  dreamImages: string[];
  userThought?: string;
  aiSummarize?: string;
  analysis?: DreamAnalysis;
  createdAt: string;
  updatedAt: string;
}

// `CreateDreamSessionDto`/`UpdateDreamSessionDto` are both fully optional —
// UpdateDto is a PartialType of CreateDto — so one input type covers both.
export type DreamSessionInput = Partial<
  Omit<DreamSession, 'id' | 'createdAt' | 'updatedAt'>
>;

// Fixed 12-value vocabulary used by DreamDetailForm in the old app
// (dreamKind is a free-form string[] in the schema, but the UI is a closed
// chip set — keep the vocabulary here so it isn't reinvented per screen).
export const DREAM_KIND_VALUES = [
  'LUCID',
  'NIGHTMARE',
  'REPEATING',
  'VIVID',
  'ABSTRACT',
  'REALISTIC',
  'ANXIETY',
  'NOSTALGIC',
  'PROPHETIC',
  'ORDINARY',
  'SURREAL',
  'HEALING',
] as const;

export type DreamKind = (typeof DREAM_KIND_VALUES)[number];

export const DREAM_KIND_LABEL: Record<DreamKind, string> = {
  LUCID: 'Lúcido',
  NIGHTMARE: 'Pesadilla',
  REPEATING: 'Recurrente',
  VIVID: 'Vívido',
  ABSTRACT: 'Abstracto',
  REALISTIC: 'Realista',
  ANXIETY: 'Ansiedad',
  NOSTALGIC: 'Nostálgico',
  PROPHETIC: 'Premonitorio',
  ORDINARY: 'Ordinario',
  SURREAL: 'Surrealista',
  HEALING: 'Sanador',
};

// GET /dream-sessions/:id/hydrated — resolves analysis.entities.* refs to
// their catalog rows in one batch call (see dream-session-hydrated.types.ts).
export interface HydratedEntityRef {
  id: string;
  name?: string;
  label?: string;
  title?: string;
  description?: string;
  kind?: string;
  intensity?: number;
  notes?: string;
  imageUri?: string;
}

export interface HydratedDreamSessionResponse {
  session: DreamSession;
  hydrated: {
    characters: Record<string, HydratedEntityRef>;
    locations: Record<string, HydratedEntityRef>;
    objects: Record<string, HydratedEntityRef>;
    contextLife: Record<string, HydratedEntityRef>;
    events: Record<string, HydratedEntityRef>;
    feelings: Record<string, HydratedEntityRef>;
  };
}

// POST /dream-sessions/:id/ai/suggest-elements
export interface SuggestedCharacter {
  name: string;
  description: string;
  isKnown: boolean;
  archetype: string;
  confidence?: number;
}

export interface SuggestedLocation {
  name: string;
  description: string;
  isFamiliar: boolean;
  setting: string;
  confidence?: number;
}

export interface SuggestedDreamObject {
  name: string;
  description?: string;
  confidence?: number;
}

export interface SuggestedDreamEvent {
  label: string;
  description?: string;
  confidence?: number;
}

export interface MatchedCatalogRef {
  catalogId: string;
  canonicalLabel: string;
}

export interface DreamElementRow<T> {
  fromAi: T;
  match: MatchedCatalogRef | null;
  emphasizeNew: boolean;
}

export interface DreamElementsSuggestResponse {
  schemaVersion: 1;
  dreamSessionId: string;
  characters: DreamElementRow<SuggestedCharacter>[];
  locations: DreamElementRow<SuggestedLocation>[];
  objects: DreamElementRow<SuggestedDreamObject>[];
  events: DreamElementRow<SuggestedDreamEvent>[];
}

// POST /dream-sessions/:id/ai/suggest-thought
export interface DreamThoughtSuggestResponse {
  schemaVersion: 1;
  dreamSessionId: string;
  suggestion: string;
}

// POST /dream-sessions/ai/summarize-recent — cross-session, not per-dream.
// Either `limit` (5/10/15/20, default 10) OR `dreamDateFrom`+`dreamDateTo`
// (both required together, YYYY-MM-DD) — never both, the backend 400s if a
// date range is only half-supplied.
export type SummarizeRecentLimit = 5 | 10 | 15 | 20;

export interface SummarizeRecentInput {
  locale?: string;
  limit?: SummarizeRecentLimit;
  dreamDateFrom?: string;
  dreamDateTo?: string;
}

export interface SummarizeRecentResponse {
  schemaVersion: 1;
  summary: string;
  count: number;
  withNarrativeCount: number;
  capped?: boolean;
}

// GET /dream-sessions/analytics/overview — lifetime metrics, no date filter.
export interface DreamAnalyticsCatalogTotals {
  characters: number;
  locations: number;
  objects: number;
  events: number;
  contextLife: number;
  feelings: number;
}

export interface DreamAnalyticsLucidityBin {
  level: number;
  count: number;
}

export interface DreamAnalyticsTopEntity {
  id: string;
  name: string;
  count: number;
}

export interface DreamAnalyticsOverview {
  dreamCount: number;
  catalogTotals: DreamAnalyticsCatalogTotals;
  lucidityHistogram: DreamAnalyticsLucidityBin[];
  topCharacters: DreamAnalyticsTopEntity[];
  topLocations: DreamAnalyticsTopEntity[];
  topObjects: DreamAnalyticsTopEntity[];
}
