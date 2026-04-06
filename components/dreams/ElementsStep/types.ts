import type { CharacterArchetype, LocationSetting, FeelingKind } from '@/services';

export type CharRow =
  | { key: string; t: 'existing'; id: string; name: string }
  | {
      key: string;
      t: 'new';
      source?: 'ai' | 'user';
      emphasizeNew?: boolean;
      name: string;
      description: string;
      isKnown: boolean;
      archetype: CharacterArchetype;
    };

export type LocRow =
  | { key: string; t: 'existing'; id: string; name: string }
  | {
      key: string;
      t: 'new';
      source?: 'ai' | 'user';
      emphasizeNew?: boolean;
      name: string;
      description: string;
      isFamiliar: boolean;
      setting: LocationSetting;
    };

export type ObjRow =
  | { key: string; t: 'existing'; id: string; name: string }
  | {
      key: string;
      t: 'new';
      source?: 'ai' | 'user';
      emphasizeNew?: boolean;
      name: string;
      description?: string;
    };

export type CtxRow =
  | { key: string; t: 'existing'; id: string; title: string }
  | {
      key: string;
      t: 'new';
      source?: 'ai' | 'user';
      emphasizeNew?: boolean;
      title: string;
      description?: string;
    };

export type EventRow =
  | { key: string; t: 'existing'; id: string; label: string }
  | {
      key: string;
      t: 'new';
      source?: 'ai' | 'user';
      emphasizeNew?: boolean;
      label: string;
      description?: string;
    };

export type FeelingRow = {
  key: string;
  id?: string;
  kind: FeelingKind;
  intensity?: number;
  notes?: string;
};

export type StepModal =
  | { kind: 'character'; mode: 'create'; namePrefill: string }
  | { kind: 'character'; mode: 'edit'; row: CharRow }
  | { kind: 'location'; mode: 'create'; namePrefill: string }
  | { kind: 'location'; mode: 'edit'; row: LocRow }
  | { kind: 'object'; mode: 'create'; namePrefill: string }
  | { kind: 'object'; mode: 'edit'; row: ObjRow }
  | { kind: 'context'; mode: 'create'; namePrefill: string }
  | { kind: 'context'; mode: 'edit'; row: CtxRow }
  | { kind: 'event'; mode: 'create'; namePrefill: string }
  | { kind: 'event'; mode: 'edit'; row: EventRow }
  | { kind: 'feeling'; mode: 'create' }
  | { kind: 'feeling'; mode: 'edit'; row: FeelingRow }
  | null;
