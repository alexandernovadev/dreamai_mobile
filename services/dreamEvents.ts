import { api } from './api';
import { buildQuery, type Paginated, type PaginatedMeta } from './query';

export type DreamEvent = {
  id: string;
  label: string;
  description?: string;
  dreamSessionId: string;
};

type ApiDreamEvent = {
  _id: string;
  label: string;
  description?: string;
  dreamSessionId: string;
};

function revive(c: ApiDreamEvent): DreamEvent {
  return {
    id: c._id,
    label: c.label,
    description: c.description,
    dreamSessionId: c.dreamSessionId,
  };
}

export type QueryDreamEventsParams = {
  page?: number;
  limit?: number;
  label?: string;
  labelExact?: string;
  dreamSessionId?: string;
};

export type CreateDreamEventInput = {
  label: string;
  description?: string;
  dreamSessionId: string;
};

export const dreamEventsService = {
  async list(params: QueryDreamEventsParams): Promise<Paginated<DreamEvent>> {
    const raw = await api.get<{
      data: ApiDreamEvent[];
      meta: PaginatedMeta;
    }>(`/dream-events${buildQuery(params)}`);
    return {
      data: raw.data.map(revive),
      meta: raw.meta,
    };
  },

  async create(input: CreateDreamEventInput): Promise<DreamEvent> {
    const raw = await api.post<ApiDreamEvent>('/dream-events', input);
    return revive(raw);
  },

  async getOne(id: string): Promise<DreamEvent> {
    const raw = await api.get<ApiDreamEvent>(
      `/dream-events/${encodeURIComponent(id)}`,
    );
    return revive(raw);
  },
};
