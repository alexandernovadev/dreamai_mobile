import type { Character } from "./character";
import type { DreamObject } from "./dream-object";
import type { Feeling } from "./feeling";
import type { LifeEvent } from "./life-event";
import type { Location } from "./location";

export enum Perspective {
  Actor = "ACTOR",
  Observer = "OBSERVER",
}

/** Clasificación global de la noche (puede coexistir con matices por segmento). */
export enum DreamKind {
  /** Terror, amenaza fuerte, despertar angustiado. */
  Nightmare = "NIGHTMARE",
  /** Sueño “corriente”, sin etiqueta fuerte. */
  Ordinary = "ORDINARY",
  /** Mundo imaginativo, ficción, irreal encantado. */
  Fantasy = "FANTASY",
  /** Consciencia de que sueñas (aunque sea parcial). */
  Lucid = "LUCID",
  /** Tensión, incomodidad; no llega a pesadilla clara. */
  Anxious = "ANXIOUS",
  /** Absurdo, bizarro, reglas oníricas imposibles. */
  Surreal = "SURREAL",
  /** Repetición de escenario o tema en el tiempo. */
  Recurrent = "RECURRENT",
  /** Varios registros a la vez. */
  Mixed = "MIXED",
  /** Aún sin clasificar. */
  Unknown = "UNKNOWN",
}

/**
 * Flujo de una entrada: texto → refinamiento/extracción → cierre estructural → tu reflexión.
 * En REFINING validas y enlazas personajes del catálogo si aplica.
 */
export enum DreamSessionStatus {
  /** 1 — Solo captura: narrativa libre; aún no segmentas ni extraes entidades. */
  Draft = "DRAFT",
  /** 2 — Refinas texto, segmentas, feelings, personajes, lugares y objetos (manual o sugerido). */
  Refining = "REFINING",
  /** 3 — Modelo onírico “completo”: entidades y análisis listos para guardar/patrón. */
  Structured = "STRUCTURED",
  /** 4 — Registraste tu pensamiento o conclusión sobre el sueño. */
  ReflectionsDone = "REFLECTIONS_DONE",
}

export interface DreamSegmentAnalysis {
  perspective: Perspective;
  entities: {
    characters: Character[];
    locations: Location[];
    objects: DreamObject[];
    feelings: Feeling[];
  };
  /**
   * Grado de lucidez (validación servidor): 0 = sin lucidez, 1–5 = intensidad.
   * El booleano `isLucid` quedó obsoleto en la API.
   */
  lucidityLevel?: number;
}

/** Normaliza `lucidityLevel` 0–5; si el servidor aún envía `isLucid` legacy, se mapea a un valor aproximado. */
export function lucidityLevelFromAnalysis(
  analysis?: DreamSegmentAnalysis | null,
): number {
  if (!analysis) return 0;
  const raw = analysis.lucidityLevel;
  if (typeof raw === 'number' && !Number.isNaN(raw)) {
    return Math.max(0, Math.min(5, Math.round(raw)));
  }
  const legacy = (analysis as { isLucid?: boolean }).isLucid;
  if (legacy === true) return 3;
  return 0;
}

export interface DreamSegment {
  id: string;
  order: number;
  rawText: string;
  /**
   * Ausente en borrador o hasta que termines la extracción.
   * En REFINING puede ir completándose poco a poco.
   */
  analysis?: DreamSegmentAnalysis;
}

export interface DreamSession {
  readonly id: string;
  timestamp: Date;
  status: DreamSessionStatus;
  /**
   * Clasificaciones de la noche: pesadilla, lúcido, etc. Permite más de una.
   * En `Draft` y `Refining` usar `[Unknown]` hasta el cierre estructural (`Structured`),
   * donde el usuario confirma o cambia la clasificación.
   */
  dreamKind: DreamKind | DreamKind[];
  /**
   * Primer volcado de texto antes de segmentar (paso 1).
   * Opcional si ya pasaste todo a `dreams[].rawText`.
   */
  rawNarrative?: string;
  /** Ids de `LifeEvent` (`/life-events`); el mismo evento puede enlazarse en varias sesiones. */
  relatedLifeEventIds?: LifeEvent['id'][];
  /** Paso 4 — qué te dejó el sueño, interpretación propia, preguntas. */
  userThought?: string;
  /**
   * Segmentos del relato. Puede ser `[]` en borrador hasta que el usuario añada partes;
   * las reglas de “al menos un segmento” son de validación por `status`, no del tipo.
   */
  dreams: DreamSegment[];
}
