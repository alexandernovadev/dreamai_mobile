import { api } from './api';
import { buildQuery, type Paginated, type PaginatedMeta } from './query';

export type LocationSetting = 'URBAN' | 'NATURE' | 'INDOOR' | 'ABSTRACT';

export type Location = {
  id: string;
  name: string;
  description: string;
  isFamiliar: boolean;
  setting: LocationSetting;
  imageUri?: string;
};

type ApiLocation = {
  _id: string;
  name: string;
  description: string;
  isFamiliar: boolean;
  setting: LocationSetting;
  imageUri?: string;
};

function revive(c: ApiLocation): Location {
  return {
    id: c._id,
    name: c.name,
    description: c.description,
    isFamiliar: c.isFamiliar,
    setting: c.setting,
    imageUri: c.imageUri,
  };
}

export type QueryLocationsParams = {
  page?: number;
  limit?: number;
  name?: string;
  nameExact?: string;
};

export type CreateLocationInput = {
  name: string;
  description: string;
  isFamiliar: boolean;
  setting: LocationSetting;
  imageUri?: string;
};

export const LOCATION_SETTING_OPTIONS: {
  value: LocationSetting;
  label: string;
}[] = [
  { value: 'URBAN', label: 'Urbano' },
  { value: 'NATURE', label: 'Naturaleza' },
  { value: 'INDOOR', label: 'Interior' },
  { value: 'ABSTRACT', label: 'Abstracto' },
];

export const locationsService = {
  async list(params: QueryLocationsParams): Promise<Paginated<Location>> {
    const raw = await api.get<{
      data: ApiLocation[];
      meta: PaginatedMeta;
    }>(`/locations${buildQuery(params)}`);
    return {
      data: raw.data.map(revive),
      meta: raw.meta,
    };
  },

  async create(input: CreateLocationInput): Promise<Location> {
    const raw = await api.post<ApiLocation>('/locations', input);
    return revive(raw);
  },

  async getOne(id: string): Promise<Location> {
    const raw = await api.get<ApiLocation>(`/locations/${encodeURIComponent(id)}`);
    return revive(raw);
  },
};
