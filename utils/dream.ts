import type { DreamSession } from '@/services';

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
