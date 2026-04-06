import { api } from './api';

/** Respuesta de `GET /meta` (Dreamia back). */
export type BackendMeta = {
  serviceName: string;
  version: string;
  buildAt: string;
  environment: string;
  commit: string;
};

export async function fetchBackendMeta(): Promise<BackendMeta> {
  return api.get<BackendMeta>('/meta');
}
