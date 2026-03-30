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
  if (input.analysis !== undefined) out.analysis = input.analysis;
  return out;
}

export const dreamSessionsService = {
  async getOne(id: string): Promise<DreamSession> {
    const raw = await api.get<ApiDreamSession>(`/dream-sessions/${id}`);
    return revive(raw);
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
};
