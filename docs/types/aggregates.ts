/**
 * Totales derivados al recorrer `DreamSession[]` guardados.
 * No se duplican en cada sueño: el dashboard los calcula (o cachea) al vuelo.
 */
export interface CharacterDashboardEntry {
  /** Clave estable: `catalogCharacterId` si existe; si no, nombre normalizado. */
  groupKey: string;
  catalogCharacterId?: string;
  /** Nombre para mostrar (p. ej. `canonicalName` representativo). */
  displayName: string;
  /** Cuántas sesiones de sueño distintas mencionan a esta figura al menos una vez. */
  dreamCount: number;
  /** Apariciones totales en segmentos (el mismo sueño puede contar varias veces). */
  occurrenceCount: number;
}

export interface LocationDashboardEntry {
  /** Clave estable derivada de `setting` + descripción normalizada. */
  groupKey: string;
  displayLabel: string;
  dreamCount: number;
  occurrenceCount: number;
}

export interface ObjectDashboardEntry {
  /** Clave estable: `catalogObjectId` o etiqueta normalizada. */
  groupKey: string;
  catalogObjectId?: string;
  displayLabel: string;
  dreamCount: number;
  occurrenceCount: number;
}
