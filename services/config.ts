/**
 * Base URL del backend Dreamia.
 * En desarrollo apunta a localhost; en producción cambiar aquí o via env.
 *
 * Expo Go en dispositivo físico: usar IP de la máquina, no localhost.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
