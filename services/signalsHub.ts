import { api, apiErrorMessage } from './api';
import {
  SIGNAL_ENTITY_SECTIONS,
  type SignalEntityListSlug,
} from './signalEntities';

export type SignalHubCardItem = {
  id: string;
  title: string;
  imageUri?: string;
  appearanceCount: number;
};

/** Response from `GET /signals/hub` (dreamia_back SignalsHubService). */
type SignalsHubApiResponse = {
  characters: SignalHubCardItem[];
  locations: SignalHubCardItem[];
  objects: SignalHubCardItem[];
  events: SignalHubCardItem[];
  lifeContext: SignalHubCardItem[];
  feelings: SignalHubCardItem[];
};

const HUB_RESPONSE_KEY: Record<
  SignalEntityListSlug,
  keyof SignalsHubApiResponse
> = {
  characters: 'characters',
  locations: 'locations',
  objects: 'objects',
  events: 'events',
  'life-context': 'lifeContext',
  feelings: 'feelings',
};

/** Single HTTP call — aggregates 6 catalog slices + appearance counts (no N+1). */
export async function fetchSignalsHub(): Promise<SignalsHubApiResponse> {
  return api.get<SignalsHubApiResponse>('/signals/hub');
}

export async function loadAllSignalHubSections(): Promise<
  Record<SignalEntityListSlug, { items: SignalHubCardItem[]; error: string | null }>
> {
  try {
    const raw = await fetchSignalsHub();
    return SIGNAL_ENTITY_SECTIONS.reduce(
      (acc, { listSlug }) => {
        const key = HUB_RESPONSE_KEY[listSlug];
        acc[listSlug] = {
          items: raw[key] ?? [],
          error: null,
        };
        return acc;
      },
      {} as Record<
        SignalEntityListSlug,
        { items: SignalHubCardItem[]; error: string | null }
      >,
    );
  } catch (e) {
    const msg = apiErrorMessage(e);
    return SIGNAL_ENTITY_SECTIONS.reduce(
      (acc, { listSlug }) => {
        acc[listSlug] = { items: [], error: msg };
        return acc;
      },
      {} as Record<
        SignalEntityListSlug,
        { items: SignalHubCardItem[]; error: string | null }
      >,
    );
  }
}
