import type { DreamSession } from '../models/dream-session.model';

export function dreamDateLabel(session: Pick<DreamSession, 'timestamp' | 'createdAt'>): string {
  const raw = session.timestamp ?? session.createdAt;
  if (!raw) return 'Sin fecha';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function dreamSnippet(rawNarrative: string, maxLength = 160): string {
  const trimmed = rawNarrative.trim();
  if (!trimmed) return 'Sin narrativa todavía…';
  return trimmed.length > maxLength
    ? `${trimmed.slice(0, maxLength).trimEnd()}…`
    : trimmed;
}
