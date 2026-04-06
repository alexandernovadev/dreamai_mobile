import { api } from './api';
import { buildQuery, type Paginated, type PaginatedMeta } from './query';

export type DreamSessionStatus =
  | 'DRAFT'
  | 'ELEMENTS'
  | 'STRUCTURED'
  | 'THOUGHT';

export type DreamSession = {
  id: string;
  timestamp?: Date;
  status: DreamSessionStatus;
  rawNarrative: string;
  dreamKind: string[];
  dreamImages: string[];
  userThought?: string;
  aiSummarize?: string;
  /** Viene del servidor; necesario para hidratar el paso Elementos. */
  analysis?: DreamAnalysisInput;
  createdAt?: Date;
  updatedAt?: Date;
};

type ApiDreamSession = {
  _id: string;
  timestamp?: string;
  status: DreamSessionStatus;
  rawNarrative?: string;
  dreamKind?: string[];
  dreamImages?: string[];
  userThought?: string;
  aiSummarize?: string;
  analysis?: DreamAnalysisInput;
  createdAt?: string;
  updatedAt?: string;
};

function revive(dto: ApiDreamSession): DreamSession {
  return {
    id: dto._id,
    timestamp: dto.timestamp ? new Date(dto.timestamp) : undefined,
    status: dto.status,
    rawNarrative: dto.rawNarrative ?? '',
    dreamKind: dto.dreamKind ?? [],
    dreamImages: dto.dreamImages ?? [],
    userThought: dto.userThought,
    aiSummarize: dto.aiSummarize,
    analysis: dto.analysis,
    createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
    updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
  };
}

export type QueryDreamSessionsParams = {
  page?: number;
  limit?: number;
  status?: DreamSessionStatus;
  rawNarrative?: string;
  dreamKind?: string;
  timestampFrom?: string;
  timestampTo?: string;
  createdFrom?: string;
  createdTo?: string;
};

export type CreateDreamSessionInput = {
  timestamp?: Date;
  status?: DreamSessionStatus;
  rawNarrative?: string;
  dreamKind?: string[];
  dreamImages?: string[];
  userThought?: string;
  /** Lectura sugerida por IA (persistida aparte de la reflexión del usuario). */
  aiSummarize?: string;
};

/** Refs que acepta el backend en `analysis.entities`. */
export type DreamEntitiesRefs = {
  characters?: { characterId: string }[];
  locations?: { locationId: string }[];
  objects?: { objectId: string }[];
  events?: { eventId: string }[];
  contextLife?: { contextLifeId: string }[];
  feelings?: { feelingId: string }[];
};

export type DreamAnalysisInput = {
  perspectives?: string[];
  lucidityLevel?: number;
  entities?: DreamEntitiesRefs;
};

export type UpdateDreamSessionInput = Partial<CreateDreamSessionInput> & {
  analysis?: DreamAnalysisInput;
};

function stripCreate(
  input: CreateDreamSessionInput,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.timestamp !== undefined) {
    out.timestamp = input.timestamp.toISOString();
  }
  if (input.status !== undefined) out.status = input.status;
  if (input.rawNarrative !== undefined) out.rawNarrative = input.rawNarrative;
  if (input.dreamKind !== undefined) out.dreamKind = input.dreamKind;
  if (input.dreamImages !== undefined) out.dreamImages = input.dreamImages;
  if (input.userThought !== undefined) out.userThought = input.userThought;
  return out;
}

function stripUpdate(
  input: UpdateDreamSessionInput,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.timestamp !== undefined) {
    out.timestamp = input.timestamp.toISOString();
  }
  if (input.status !== undefined) out.status = input.status;
  if (input.rawNarrative !== undefined) out.rawNarrative = input.rawNarrative;
  if (input.dreamKind !== undefined) out.dreamKind = input.dreamKind;
  if (input.dreamImages !== undefined) out.dreamImages = input.dreamImages;
  if (input.userThought !== undefined) out.userThought = input.userThought;
  if (input.aiSummarize !== undefined) out.aiSummarize = input.aiSummarize;
  if (input.analysis !== undefined) out.analysis = input.analysis;
  return out;
}

/** Hint de idioma para la IA (salida alineada con la app en español). */
export const DEFAULT_AI_SUGGEST_LOCALE = 'es';

/** Respuesta de `POST /dream-sessions/:id/ai/suggest-thought`. */
export type DreamRecentSummarizeResponse = {
  schemaVersion: number;
  summary: string;
};

export type DreamThoughtSuggestResponse = {
  schemaVersion: number;
  dreamSessionId: string;
  suggestion: string;
};

/** Respuesta de `GET /dream-sessions/:id/hydrated`. */
export type DreamSessionHydratedMaps = {
  characters: Record<string, { id: string; name: string; description?: string }>;
  locations: Record<string, { id: string; name: string; description?: string }>;
  objects: Record<string, { id: string; name: string; description?: string }>;
  contextLife: Record<
    string,
    { id: string; title: string; description?: string }
  >;
  events: Record<string, { id: string; label: string; description?: string }>;
  feelings: Record<
    string,
    { id: string; kind: string; intensity?: number; notes?: string }
  >;
};

export type DreamSessionHydratedResponse = {
  session: DreamSession;
  hydrated: DreamSessionHydratedMaps;
};

export type DreamAnalyticsCatalogTotals = {
  characters: number;
  locations: number;
  objects: number;
  events: number;
  contextLife: number;
  feelings: number;
};

export type DreamAnalyticsLucidityBin = {
  level: number;
  count: number;
};

export type DreamAnalyticsTopEntity = {
  id: string;
  name: string;
  count: number;
};

/** `GET /dream-sessions/analytics/overview` (toda la vida, sin filtro de fechas). */
export type DreamAnalyticsOverview = {
  dreamCount: number;
  catalogTotals: DreamAnalyticsCatalogTotals;
  lucidityHistogram: DreamAnalyticsLucidityBin[];
  topCharacters: DreamAnalyticsTopEntity[];
  topLocations: DreamAnalyticsTopEntity[];
  topObjects: DreamAnalyticsTopEntity[];
};

export const dreamSessionsService = {
  async getOne(id: string): Promise<DreamSession> {
    const raw = await api.get<ApiDreamSession>(`/dream-sessions/${id}`);
    return revive(raw);
  },

  /** Una petición: sesión + mapas de catálogo por id (batch en servidor). */
  async getHydrated(id: string): Promise<DreamSessionHydratedResponse> {
    const raw = await api.get<{
      session: ApiDreamSession;
      hydrated: DreamSessionHydratedMaps;
    }>(`/dream-sessions/${id}/hydrated`);
    return { session: revive(raw.session), hydrated: raw.hydrated };
  },

  async getAnalyticsOverview(): Promise<DreamAnalyticsOverview> {
    return api.get<DreamAnalyticsOverview>(
      '/dream-sessions/analytics/overview',
    );
  },

  async list(params: QueryDreamSessionsParams = {}): Promise<Paginated<DreamSession>> {
    const raw = await api.get<{
      data: ApiDreamSession[];
      meta: PaginatedMeta;
    }>(`/dream-sessions${buildQuery(params)}`);
    return {
      data: raw.data.map(revive),
      meta: raw.meta,
    };
  },

  async create(input: CreateDreamSessionInput): Promise<DreamSession> {
    const raw = await api.post<ApiDreamSession>(
      '/dream-sessions',
      stripCreate(input),
    );
    return revive(raw);
  },

  async update(
    id: string,
    input: UpdateDreamSessionInput,
  ): Promise<DreamSession> {
    const raw = await api.patch<ApiDreamSession>(
      `/dream-sessions/${id}`,
      stripUpdate(input),
    );
    return revive(raw);
  },

  /**
   * Dream AI Help (Elementos): sugiere entidades desde `rawNarrative` + empareja catálogo.
   * No persiste en la sesión. Envía `locale` fijo en español para el hint del modelo.
   */
  async suggestDreamElements(
    sessionId: string,
  ): Promise<DreamElementsSuggestResponse> {
    return api.post<DreamElementsSuggestResponse>(
      `/dream-sessions/${sessionId}/ai/suggest-elements`,
      { locale: DEFAULT_AI_SUGGEST_LOCALE },
    );
  },

  /** Reflexión: lectura sugerida (no persiste hasta que guardes `aiSummarize` en update). */
  async suggestThought(sessionId: string): Promise<DreamThoughtSuggestResponse> {
    return api.post<DreamThoughtSuggestResponse>(
      `/dream-sessions/${sessionId}/ai/suggest-thought`,
      { locale: DEFAULT_AI_SUGGEST_LOCALE },
    );
  },

  /** Últimos 6 sueños con narrativa → resumen de patrones (IA; no persiste). */
  async summarizeRecent(): Promise<DreamRecentSummarizeResponse> {
    return api.post<DreamRecentSummarizeResponse>(
      '/dream-sessions/ai/summarize-recent',
      { locale: DEFAULT_AI_SUGGEST_LOCALE },
    );
  },
};

/** Respuesta de `POST /dream-sessions/:id/ai/suggest-elements` (staging; no escribe entidades). */
export type DreamElementsSuggestResponse = {
  schemaVersion: number;
  dreamSessionId: string;
  characters: DreamElementSuggestRow<SuggestedCharacterFromAi>[];
  locations: DreamElementSuggestRow<SuggestedLocationFromAi>[];
  objects: DreamElementSuggestRow<SuggestedObjectFromAi>[];
  events: DreamElementSuggestRow<SuggestedEventFromAi>[];
};

export type MatchedCatalogRef = {
  catalogId: string;
  canonicalLabel: string;
};

export type DreamElementSuggestRow<T> = {
  fromAi: T;
  match: MatchedCatalogRef | null;
  emphasizeNew: boolean;
};

export type SuggestedCharacterFromAi = {
  name: string;
  description: string;
  isKnown: boolean;
  archetype: string;
  confidence?: number;
};

export type SuggestedLocationFromAi = {
  name: string;
  description: string;
  isFamiliar: boolean;
  setting: string;
  confidence?: number;
};

export type SuggestedObjectFromAi = {
  name: string;
  description?: string;
  confidence?: number;
};

export type SuggestedEventFromAi = {
  label: string;
  description?: string;
  confidence?: number;
};

