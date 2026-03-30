/**
 * Valores de `analysis.perspectives`. Debe coincidir con
 * `dreamia_back/.../dream-perspectives.constants.ts`.
 */
export const DREAM_PERSPECTIVE_OPTIONS: { value: string; label: string }[] = [
  { value: 'ACTOR', label: 'Actor' },
  { value: 'OBSERVER', label: 'Observador' },
];

const ALLOWED = new Set(DREAM_PERSPECTIVE_OPTIONS.map((o) => o.value));

export function dreamPerspectiveLabel(value: string): string {
  return DREAM_PERSPECTIVE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/** Solo valores válidos para API (descarta valores antiguos). */
export function filterAllowedPerspectives(values: string[]): string[] {
  return values.filter((v) => ALLOWED.has(v));
}

/** Si no hay ninguna perspectiva guardada, por defecto «Actor» marcado. */
export function perspectivesForForm(values: string[]): string[] {
  const ok = filterAllowedPerspectives(values);
  return ok.length > 0 ? ok : ['ACTOR'];
}
