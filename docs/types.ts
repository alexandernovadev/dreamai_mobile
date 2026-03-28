export enum Perspective {
  Actor = "ACTOR",
  Observer = "OBSERVER",
}

export enum Archetype {
  Shadow = "SHADOW",
  AnimaAnimus = "ANIMA_ANIMUS",
  WiseFigure = "WISE_FIGURE",
  Persona = "PERSONA",
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
  biographicalContext?: string; // Ej: "Panadería de la infancia"
}

interface DreamSegment {
  id: string;
  order: number;
  rawText: string;
  analysis: {
    perspective: Perspective;
    entities: {
      characters: Character[];
      location: Location;
    };
    // Quitamos metrics y simplificamos lucidez
    isLucid: boolean;
  };
}

export interface DreamSession {
  readonly id: string;
  timestamp: Date;
  userReflections: string; // Un solo campo de texto para tus conclusiones
  dreams: DreamSegment[];
}
