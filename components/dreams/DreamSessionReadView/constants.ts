import type { SignalEntityListSlug } from '@/services/signalEntities';
import { Ionicons } from '@expo/vector-icons';
import { statusTone, statusLabel } from '@/theme';

// ── Status labels & tones (from theme) ──────────────────────────────────

export const STATUS_LABEL = statusLabel;
export const STATUS_TONE = statusTone;

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
