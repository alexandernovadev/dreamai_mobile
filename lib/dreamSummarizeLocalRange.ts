/**
 * Inicio y fin del día calendario local (dispositivo) para `YYYY-MM-DD`, en ISO UTC.
 * Así el backend filtra `timestamp` alineado con lo que el usuario eligió en el picker.
 */
export function localCalendarDayBoundsUtcIso(
  fromYmd: string,
  toYmd: string,
): { timestampStart: string; timestampEnd: string } {
  const [y1, m1, d1] = fromYmd.split('-').map(Number);
  const [y2, m2, d2] = toYmd.split('-').map(Number);
  const start = new Date(y1, m1 - 1, d1, 0, 0, 0, 0);
  const end = new Date(y2, m2 - 1, d2, 23, 59, 59, 999);
  return {
    timestampStart: start.toISOString(),
    timestampEnd: end.toISOString(),
  };
}
