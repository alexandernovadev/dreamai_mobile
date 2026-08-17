// Catalog entity shapes — mirror dreamia_back's schemas field-for-field (real
// backend keys, not a normalized shape) so there's no translation layer at
// the API boundary. See dreamia_back/src/{character,location,dream-object,
// dream-event,feeling,context-life}/schemas/*.schema.ts.

export type CharacterArchetype =
  | 'SHADOW'
  | 'ANIMA_ANIMUS'
  | 'WISE_FIGURE'
  | 'PERSONA'
  | 'UNKNOWN';

export const CHARACTER_ARCHETYPE_LABEL: Record<CharacterArchetype, string> = {
  SHADOW: 'Sombra',
  ANIMA_ANIMUS: 'Anima/Animus',
  WISE_FIGURE: 'Figura sabia',
  PERSONA: 'Persona',
  UNKNOWN: 'Desconocido',
};

export interface Character {
  id: string;
  name: string;
  description: string;
  isKnown: boolean;
  archetype: CharacterArchetype;
  imageUri?: string;
  createdAt: string;
  updatedAt: string;
}

export type LocationSetting = 'URBAN' | 'NATURE' | 'INDOOR' | 'ABSTRACT';

export const LOCATION_SETTING_LABEL: Record<LocationSetting, string> = {
  URBAN: 'Urbano',
  NATURE: 'Naturaleza',
  INDOOR: 'Interior',
  ABSTRACT: 'Abstracto',
};

export interface Location {
  id: string;
  name: string;
  description: string;
  isFamiliar: boolean;
  setting: LocationSetting;
  imageUri?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DreamObject {
  id: string;
  name: string;
  description?: string;
  imageUri?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DreamEvent {
  id: string;
  label: string;
  description?: string;
  dreamSessionId: string;
  createdAt: string;
  updatedAt: string;
}

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

// Labels mirror dreamia_back/src/feeling/feeling-kind.ts FEELING_KIND_META.
export const FEELING_KIND_LABEL: Record<FeelingKind, string> = {
  AWE: 'Asombro',
  PENA: 'Pena',
  BOREDOM: 'Aburrimiento',
  CALM: 'Calma',
  CONFUSION: 'Confusión',
  CRAVING: 'Anhelo',
  DISGUST: 'Asco',
  EMPATHIC_PAIN: 'Dolor empático',
  SEXUAL_DESIRE: 'Deseo sexual',
  AMUSEMENT: 'Diversión',
  ENVY: 'Envidia',
  ENTHUSIASM: 'Entusiasmo',
  FEAR: 'Miedo / horror',
  INTEREST: 'Interés',
  JOY: 'Alegría',
  NOSTALGIA: 'Nostalgia',
  ROMANCE: 'Romance',
  SADNESS: 'Tristeza',
  SATISFACTION: 'Satisfacción',
  SYMPATHY: 'Simpatía',
  TRIUMPH: 'Triunfo',
  ANXIETY: 'Ansiedad',
  ANGER: 'Ira',
};

export const FEELING_KINDS: FeelingKind[] = Object.keys(
  FEELING_KIND_LABEL,
) as FeelingKind[];

/** Mirrors dreamia_back/src/signals/signals-hub.service.ts's `feelingTitleEn`
 * (splits `kind` on `_`, title-cases each word) — the Signals hub/catalog
 * endpoints only expose that generated English title, not the raw `kind`
 * enum, so this reverses it back to the real Spanish label. */
function feelingTitleEn(kind: string): string {
  return kind
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

export const FEELING_TITLE_EN_TO_LABEL: Record<string, string> = Object.fromEntries(
  FEELING_KINDS.map((k) => [feelingTitleEn(k), FEELING_KIND_LABEL[k]]),
);

export interface Feeling {
  id: string;
  kind: FeelingKind;
  intensity?: number;
  notes?: string;
  dreamSessionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContextLife {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
