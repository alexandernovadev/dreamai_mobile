import type { DreamSession } from '@/services';
import { DREAM_KIND_OPTIONS, dreamPerspectiveLabel, FEELING_KIND_OPTIONS } from '@/services';

/** Fecha legible para listas y tarjetas (timestamp o creación). */
export function dreamDateLabel(d: DreamSession): string {
  const when = d.timestamp ?? d.createdAt;
  if (!when) return 'Sin fecha';
  return new Intl.DateTimeFormat('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(when);
}

/** Extracto corto de narrativa para listados. */
export function dreamSnippet(raw: string): string {
  const t = raw.trim();
  if (!t) return 'Sin narrativa…';
  return t.length > 140 ? `${t.slice(0, 140)}…` : t;
}

/** Fecha completa para vista de detalle. */
export function formatDreamDateTime(d: Date): string {
  return new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** Fecha compacta para metadatos (creado/actualizado). */
export function formatMetaDate(d: Date): string {
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** Label legible de un dream kind. */
export function dreamKindLabel(value: string): string {
  return DREAM_KIND_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/** Label legible de un feeling kind. */
export function feelingKindLabel(kind: string): string {
  return FEELING_KIND_OPTIONS.find((o) => o.value === kind)?.label ?? kind;
}
