/**
 * Normaliza ids en refs de `analysis.entities` (string u ObjectId serializado desde Mongo/API).
 */
export function entityRefId(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  return String(v);
}
