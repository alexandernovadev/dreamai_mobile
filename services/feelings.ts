import { api } from './api';
import type { DreamAppearances } from './dreamAppearances';
import { buildQuery, type Paginated, type PaginatedMeta } from './query';

/** Alineado con `FeelingKind` del backend. */
export type FeelingKind =
  | 'AWE'
  | 'PENA'
  | 'BOREDOM'
  | 'CALM'
  | 'CONFUSION'
  | 'CRAVING'
  | 'DISGUST'
  | 'EMPATHIC_PAIN'
  | 'SEXUAL_DESIRE'
  | 'AMUSEMENT'
  | 'ENVY'
  | 'ENTHUSIASM'
  | 'FEAR'
  | 'INTEREST'
  | 'JOY'
  | 'NOSTALGIA'
  | 'ROMANCE'
  | 'SADNESS'
  | 'SATISFACTION'
  | 'SYMPATHY'
  | 'TRIUMPH'
  | 'ANXIETY'
  | 'ANGER';

export type Feeling = {
  id: string;
  kind: FeelingKind;
  intensity?: number;
  notes?: string;
  dreamSessionId: string;
};

type ApiFeeling = {
  _id: string;
  kind: FeelingKind;
  intensity?: number;
  notes?: string;
  dreamSessionId: string;
};

function revive(c: ApiFeeling): Feeling {
  return {
    id: c._id,
    kind: c.kind,
    intensity: c.intensity,
    notes: c.notes,
    dreamSessionId: c.dreamSessionId,
  };
}

export type QueryFeelingsParams = {
  page?: number;
  limit?: number;
  kind?: FeelingKind;
  dreamSessionId?: string;
};

export type CreateFeelingInput = {
  kind: FeelingKind;
  intensity?: number;
  notes?: string;
  dreamSessionId: string;
};

export type UpdateFeelingInput = Partial<CreateFeelingInput>;

export const feelingsService = {
  async list(params: QueryFeelingsParams): Promise<Paginated<Feeling>> {
    const raw = await api.get<{
      data: ApiFeeling[];
      meta: PaginatedMeta;
    }>(`/feelings${buildQuery(params)}`);
    return {
      data: raw.data.map(revive),
      meta: raw.meta,
    };
  },

  async create(input: CreateFeelingInput): Promise<Feeling> {
    const raw = await api.post<ApiFeeling>('/feelings', input);
    return revive(raw);
  },

  async getOne(id: string): Promise<Feeling & { dreamAppearances?: DreamAppearances }> {
    const raw = await api.get<ApiFeeling & { dreamAppearances?: DreamAppearances }>(
      `/feelings/${encodeURIComponent(id)}`,
    );
    return { ...revive(raw), dreamAppearances: raw.dreamAppearances };
  },

  async update(id: string, input: UpdateFeelingInput): Promise<Feeling> {
    const raw = await api.patch<ApiFeeling>(
      `/feelings/${encodeURIComponent(id)}`,
      input,
    );
    return revive(raw);
  },
};

/** Opciones para `Select` (etiquetas en español, alineadas al back). */
export const FEELING_KIND_OPTIONS: { value: FeelingKind; label: string }[] = [
  { value: 'AWE', label: 'Asombro' },
  { value: 'PENA', label: 'Pena' },
  { value: 'BOREDOM', label: 'Aburrimiento' },
  { value: 'CALM', label: 'Calma' },
  { value: 'CONFUSION', label: 'Confusión' },
  { value: 'CRAVING', label: 'Anhelo' },
  { value: 'DISGUST', label: 'Asco' },
  { value: 'EMPATHIC_PAIN', label: 'Dolor empático' },
  { value: 'SEXUAL_DESIRE', label: 'Deseo sexual' },
  { value: 'AMUSEMENT', label: 'Diversión' },
  { value: 'ENVY', label: 'Envidia' },
  { value: 'ENTHUSIASM', label: 'Entusiasmo' },
  { value: 'FEAR', label: 'Miedo / horror' },
  { value: 'INTEREST', label: 'Interés' },
  { value: 'JOY', label: 'Alegría' },
  { value: 'NOSTALGIA', label: 'Nostalgia' },
  { value: 'ROMANCE', label: 'Romance' },
  { value: 'SADNESS', label: 'Tristeza' },
  { value: 'SATISFACTION', label: 'Satisfacción' },
  { value: 'SYMPATHY', label: 'Simpatía' },
  { value: 'TRIUMPH', label: 'Triunfo' },
  { value: 'ANXIETY', label: 'Ansiedad' },
  { value: 'ANGER', label: 'Ira' },
];
