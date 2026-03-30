import { api } from './api';
import { buildQuery, type Paginated, type PaginatedMeta } from './query';

export type ContextLife = {
  id: string;
  title: string;
  description?: string;
};

type ApiContextLife = {
  _id: string;
  title: string;
  description?: string;
};

function revive(c: ApiContextLife): ContextLife {
  return {
    id: c._id,
    title: c.title,
    description: c.description,
  };
}

export type QueryContextLivesParams = {
  page?: number;
  limit?: number;
  title?: string;
  titleExact?: string;
};

export type CreateContextLifeInput = {
  title: string;
  description?: string;
};

export const contextLivesService = {
  async list(params: QueryContextLivesParams): Promise<Paginated<ContextLife>> {
    const raw = await api.get<{
      data: ApiContextLife[];
      meta: PaginatedMeta;
    }>(`/context-lives${buildQuery(params)}`);
    return {
      data: raw.data.map(revive),
      meta: raw.meta,
    };
  },

  async create(input: CreateContextLifeInput): Promise<ContextLife> {
    const raw = await api.post<ApiContextLife>('/context-lives', input);
    return revive(raw);
  },

  async getOne(id: string): Promise<ContextLife> {
    const raw = await api.get<ApiContextLife>(
      `/context-lives/${encodeURIComponent(id)}`,
    );
    return revive(raw);
  },
};
