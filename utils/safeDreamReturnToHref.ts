/**
 * Sanitiza `returnTo` (query) para volver de Signals al detalle de un sueño.
 * Solo acepta `/dream/:id` con un único segmento (sin path traversal).
 */
export function safeDreamReturnToHref(
  raw: string | string[] | undefined,
): string | null {
  if (raw == null) return null;
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== 'string' || !v.trim()) return null;

  let decoded = v.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return null;
  }

  const pathOnly = decoded.split('?')[0].split('#')[0].trim();
  if (!pathOnly.startsWith('/dream/')) return null;
  if (pathOnly.includes('..') || pathOnly.includes('//')) return null;

  const rest = pathOnly.slice('/dream/'.length);
  if (!rest || rest.includes('/')) return null;

  if (!/^[a-zA-Z0-9_-]+$/.test(rest)) return null;

  return `/dream/${rest}`;
}
