import { api } from './api';

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
  };
}

export type CreateDreamSessionInput = {
  timestamp?: Date;
  status?: DreamSessionStatus;
  rawNarrative?: string;
  dreamKind?: string[];
};

export type UpdateDreamSessionInput = Partial<CreateDreamSessionInput>;

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
  return out;
}

export const dreamSessionsService = {
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
