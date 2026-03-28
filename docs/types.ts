export enum Perspective {
  Actor = "ACTOR",
  Observer = "OBSERVER",
}

export enum Archetype {
  /** Lo reprimido o negado: miedos, impulsos,
   * vergüenza; el “otro” en el sueño que refleja lo que no integramos. */
  Shadow = "SHADOW",
  /** Imagen del contrasexual en el psiquismo (ánima / ánimus):
   * vínculo afectivo, inspiración o tirania interior. */
  AnimaAnimus = "ANIMA_ANIMUS",
  /** Figura de sabiduría o guía: anciano, maestro, terapeuta onírico;
   *  orden de sentido frente al caos. */
  WiseFigure = "WISE_FIGURE",
  /** La máscara social: rol público, apariencia, adaptación;
   * cómo nos presentamos ante otros. */
  Persona = "PERSONA",
  /** No encaja claramente en las categorías anteriores
   * o aún no se ha clasificado. */
  Unknown = "UNKNOWN",
}

interface Character {
  id: string;
  rawName: string;
  canonicalName: string;
  isKnown: boolean;
  archetype: Archetype;
}

interface Location {
  isFamiliar: boolean;
  setting: "URBAN" | "NATURE" | "INDOOR" | "ABSTRACT";
  description: string;
  biographicalContext?: string;
}

interface DreamSegment {
  id: string;
  order: number;
  rawText: string;
  analysis: {
    perspective: Perspective;
    entities: {
      characters: Character[];
      locations: Location[];
    };
    isLucid: boolean;
  };
}

export interface DreamSession {
  readonly id: string;
  timestamp: Date;
  userReflections: string;
  dreams: DreamSegment[];
}
