/**
 * Objeto onírico: cosas materiales o simbólicas en el relato (llaves, vehículos,
 * armas, teléfonos, regalos…). Complementa personajes y lugares en la lectura onírica.
 */
export interface DreamObject {
  id: string;
  /** Nombre corto o tipo (“las llaves”, “el coche de mi padre”). */
  label: string;
  /** Papel en la escena, estado, asociación personal; opcional. */
  description?: string;
  /** Si enlazas el mismo objeto recurrente entre sueños (catálogo propio). */
  catalogObjectId?: string;
  /** Referencia visual opcional elegida por el usuario. */
  imageUri?: string;
}
