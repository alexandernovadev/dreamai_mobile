import { api } from './api';
import type { DreamAppearances } from './dreamAppearances';
import { buildQuery, type Paginated, type PaginatedMeta } from './query';

export type DreamObject = {
  id: string;
  name: string;
  description?: string;
  imageUri?: string;
};

type ApiDreamObject = {
  _id: string;
  name: string;
  description?: string;
  imageUri?: string;
};

function revive(c: ApiDreamObject): DreamObject {
  return {
    id: c._id,
    name: c.name,
    description: c.description,
    imageUri: c.imageUri,
  };
}

export type QueryDreamObjectsParams = {
  page?: number;
  limit?: number;
  name?: string;
  nameExact?: string;
};

export type CreateDreamObjectInput = {
  name: string;
  description?: string;
  imageUri?: string;
};

export type UpdateDreamObjectInput = Partial<CreateDreamObjectInput>;

export const dreamObjectsService = {
  async list(params: QueryDreamObjectsParams): Promise<Paginated<DreamObject>> {
    const raw = await api.get<{
      data: ApiDreamObject[];
      meta: PaginatedMeta;
    }>(`/dream-objects${buildQuery(params)}`);
    return {
      data: raw.data.map(revive),
      meta: raw.meta,
    };
  },

  async create(input: CreateDreamObjectInput): Promise<DreamObject> {
    const raw = await api.post<ApiDreamObject>('/dream-objects', input);
    return revive(raw);
  },

  async getOne(id: string): Promise<DreamObject & { dreamAppearances?: DreamAppearances }> {
    const raw = await api.get<ApiDreamObject & { dreamAppearances?: DreamAppearances }>(
      `/dream-objects/${encodeURIComponent(id)}`,
    );
    return { ...revive(raw), dreamAppearances: raw.dreamAppearances };
  },

  async update(id: string, input: UpdateDreamObjectInput): Promise<DreamObject> {
    const raw = await api.patch<ApiDreamObject>(
      `/dream-objects/${encodeURIComponent(id)}`,
      input,
    );
    return revive(raw);
  },
};
