/** Tipo de escenario; la descripción libre refina el matiz. */
export type LocationSetting =
  | "URBAN"
  | "NATURE"
  | "INDOOR"
  | "ABSTRACT";

/** Un lugar dentro del sueño (puede haber varios por segmento). */
export interface Location {
  id: string;
  isFamiliar: boolean;
  setting: LocationSetting;
  description: string;
  biographicalContext?: string;
  /** Imagen opcional si el usuario asocia una referencia visual al lugar. */
  imageUri?: string;
}
