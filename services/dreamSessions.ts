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
  if (input.analysis !== undefined) out.analysis = input.analysis;
  return out;
}

/** Hint de idioma para la IA (salida alineada con la app en español). */
export const DEFAULT_AI_SUGGEST_LOCALE = 'es';

/** Respuesta de `GET /dream-sessions/:id/hydrated`. */
export type DreamSessionHydratedMaps = {
  characters: Record<string, { id: string; name: string }>;
  locations: Record<string, { id: string; name: string }>;
  objects: Record<string, { id: string; name: string }>;
  contextLife: Record<string, { id: string; title: string }>;
  events: Record<string, { id: string; label: string }>;
  feelings: Record<
    string,
    { id: string; kind: string; intensity?: number; notes?: string }
  >;
};

export type DreamSessionHydratedResponse = {
  session: DreamSession;
  hydrated: DreamSessionHydratedMaps;
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
  quote?: string;
  confidence?: number;
};

export type SuggestedLocationFromAi = {
  name: string;
  description: string;
  isFamiliar: boolean;
  setting: string;
  quote?: string;
  confidence?: number;
};

export type SuggestedObjectFromAi = {
  name: string;
  description?: string;
  quote?: string;
  confidence?: number;
};

export type SuggestedEventFromAi = {
  label: string;
  description?: string;
  quote?: string;
  confidence?: number;
};

