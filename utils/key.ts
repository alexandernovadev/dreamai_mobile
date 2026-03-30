/** Clave estable para listas React (chips, filas) sin usar índices. */
export function newKey(): string {
  return `k-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
