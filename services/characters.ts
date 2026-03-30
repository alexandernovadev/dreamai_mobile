import { api } from './api';
import type { DreamAppearances } from './dreamAppearances';
import { buildQuery, type Paginated, type PaginatedMeta } from './query';

export type CharacterArchetype =
  | 'SHADOW'
  | 'ANIMA_ANIMUS'
  | 'WISE_FIGURE'
  | 'PERSONA'
  | 'UNKNOWN';

export type Character = {
  id: string;
  name: string;
  description: string;
  isKnown: boolean;
  archetype: CharacterArchetype;
  imageUri?: string;
};

type ApiCharacter = {
  _id: string;
  name: string;
  description: string;
  isKnown: boolean;
  archetype: CharacterArchetype;
  imageUri?: string;
};

function revive(c: ApiCharacter): Character {
  return {
    id: c._id,
    name: c.name,
    description: c.description,
    isKnown: c.isKnown,
    archetype: c.archetype,
    imageUri: c.imageUri,
  };
}

export type QueryCharactersParams = {
  page?: number;
  limit?: number;
  name?: string;
  nameExact?: string;
};

export type CreateCharacterInput = {
  name: string;
  description: string;
  isKnown: boolean;
  archetype: CharacterArchetype;
  imageUri?: string;
};

export type UpdateCharacterInput = Partial<CreateCharacterInput>;

/** Etiquetas en español para formularios. */
export const CHARACTER_ARCHETYPE_OPTIONS: {
  value: CharacterArchetype;
  label: string;
}[] = [
  { value: 'SHADOW', label: 'Sombra' },
  { value: 'ANIMA_ANIMUS', label: 'Anima / Animus' },
  { value: 'WISE_FIGURE', label: 'Figura sabia' },
  { value: 'PERSONA', label: 'Persona' },
  { value: 'UNKNOWN', label: 'Desconocido' },
];

export const charactersService = {
  async list(params: QueryCharactersParams): Promise<Paginated<Character>> {
    const raw = await api.get<{
      data: ApiCharacter[];
      meta: PaginatedMeta;
    }>(`/characters${buildQuery(params)}`);
    return {
      data: raw.data.map(revive),
      meta: raw.meta,
    };
  },

  async create(input: CreateCharacterInput): Promise<Character> {
    const raw = await api.post<ApiCharacter>('/characters', input);
    return revive(raw);
  },

  async getOne(id: string): Promise<Character & { dreamAppearances?: DreamAppearances }> {
    const raw = await api.get<ApiCharacter & { dreamAppearances?: DreamAppearances }>(
      `/characters/${encodeURIComponent(id)}`,
    );
    return { ...revive(raw), dreamAppearances: raw.dreamAppearances };
  },

  async update(id: string, input: UpdateCharacterInput): Promise<Character> {
    const raw = await api.patch<ApiCharacter>(
      `/characters/${encodeURIComponent(id)}`,
      input,
    );
    return revive(raw);
  },
};
