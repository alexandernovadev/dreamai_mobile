import type { DreamSession } from '@/lib/docs/types/dream';

/** Backend / DB a veces devuelve un placeholder (p. ej. 1986); lo tratamos como “sin fecha real”. */
export function isLikelyPlaceholderDreamTimestamp(d: Date): boolean {
  const ms = d.getTime();
  if (!Number.isFinite(ms)) return true;
  return d.getFullYear() < 1990;
}

export function effectiveDreamDate(session: Pick<DreamSession, 'timestamp'>): Date {
  return isLikelyPlaceholderDreamTimestamp(session.timestamp)
    ? new Date()
    : new Date(session.timestamp.getTime());
}
