import type { SignalEntityListSlug } from '@/services/signalEntities';
import type { DreamSessionStatus } from '@/services';
import { Ionicons } from '@expo/vector-icons';

// ── Status labels & tones ────────────────────────────────────────────────

export const STATUS_LABEL: Record<DreamSessionStatus, string> = {
  DRAFT: 'Borrador',
  ELEMENTS: 'Elementos',
  STRUCTURED: 'Detalle',
  THOUGHT: 'Reflexión',
};

export const STATUS_TONE: Record<
  DreamSessionStatus,
  { bg: string; border: string; text: string }
> = {
  DRAFT: {
    bg: 'rgba(124, 92, 196, 0.14)',
    border: 'rgba(124, 92, 196, 0.35)',
    text: '#c4b0f0',
  },
  ELEMENTS: {
    bg: 'rgba(80, 168, 255, 0.14)',
    border: 'rgba(80, 168, 255, 0.35)',
    text: '#8cc8ff',
  },
  STRUCTURED: {
    bg: 'rgba(64, 240, 160, 0.12)',
    border: 'rgba(64, 240, 160, 0.35)',
    text: '#80f0b8',
  },
  THOUGHT: {
    bg: 'rgba(240, 200, 96, 0.14)',
    border: 'rgba(240, 200, 96, 0.35)',
    text: '#f0d890',
  },
};

// ── Dream kind chip variants ──────────────────────────────────────────────

export const KIND_VARIANTS = [
  'purple',
  'blue',
  'teal',
  'green',
  'orange',
  'rose',
] as const;

// ── Entity section icons & accents ────────────────────────────────────────

export const ENTITY_ICON: Record<
  SignalEntityListSlug,
  keyof typeof Ionicons.glyphMap
> = {
  characters: 'person-outline',
  locations: 'location-outline',
  objects: 'cube-outline',
  events: 'flash-outline',
  'life-context': 'globe-outline',
  feelings: 'heart-outline',
};

export const ENTITY_ACCENT: Record<
  SignalEntityListSlug,
  { color: string; bg: string; border: string }
> = {
  characters: {
    color: '#d8b4ff',
    bg: 'rgba(172, 111, 255, 0.14)',
    border: 'rgba(172, 111, 255, 0.28)',
  },
  locations: {
    color: '#8fd1ff',
    bg: 'rgba(80, 168, 255, 0.14)',
    border: 'rgba(80, 168, 255, 0.28)',
  },
  objects: {
    color: '#7ee7c8',
    bg: 'rgba(64, 240, 160, 0.12)',
    border: 'rgba(64, 240, 160, 0.28)',
  },
  events: {
    color: '#ffd58a',
    bg: 'rgba(255, 196, 92, 0.14)',
    border: 'rgba(255, 196, 92, 0.28)',
  },
  'life-context': {
    color: '#f6a6d7',
    bg: 'rgba(236, 120, 184, 0.14)',
    border: 'rgba(236, 120, 184, 0.28)',
  },
  feelings: {
    color: '#ff9ea1',
    bg: 'rgba(255, 118, 118, 0.14)',
    border: 'rgba(255, 118, 118, 0.28)',
  },
};
