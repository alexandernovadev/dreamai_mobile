import type { Archetype } from '@/lib/docs/types/character';
import type { LocationSetting } from '@/lib/docs/types/location';
import { api } from './api';

export interface AiSuggestedCharacter {
  name: string;
  description: string;
  isKnown: boolean;
  archetype: Archetype;
  quote?: string;
}

export interface AiSuggestedLocation {
  name: string;
  description: string;
  isFamiliar: boolean;
  setting: LocationSetting;
  quote?: string;
}

export interface AiSuggestedObject {
  name: string;
  description: string;
  quote?: string;
}

export interface AiSuggestEntitiesResponse {
  characters: AiSuggestedCharacter[];
  locations: AiSuggestedLocation[];
  objects: AiSuggestedObject[];
}

export interface AiSuggestEntitiesRequest {
  text: string;
  locale?: string;
}

export const aiService = {
  suggestEntities(req: AiSuggestEntitiesRequest): Promise<AiSuggestEntitiesResponse> {
    return api.post<AiSuggestEntitiesResponse>('/ai/suggest-entities', req);
  },
};
