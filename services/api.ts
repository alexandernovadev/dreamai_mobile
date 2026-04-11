import { API_BASE_URL } from './config';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API ${status}`);
    this.name = 'ApiError';
  }
}

/** Mensaje legible para UI a partir de un error de `api` o cualquier `unknown`. */
export function apiErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 0) {
      return 'No hay conexión con el servidor. Revisa la red y que EXPO_PUBLIC_API_URL sea correcta.';
    }
    const b = e.body;
    if (b && typeof b === 'object' && 'message' in b) {
      const m = (b as { message: unknown }).message;
      if (Array.isArray(m)) return m.join('\n');
      if (typeof m === 'string') return m;
    }
    return `Error del servidor (${e.status}).`;
  }
  if (e instanceof Error) return e.message;
  return 'Error desconocido.';
}

const API_TIMEOUT_MS = 15_000; // 15s — evita queries "colgadas"

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError(0, `Timeout: el servidor no respondió en ${API_TIMEOUT_MS / 1000}s`);
    }
    throw new ApiError(0, 'Network error');
  }

  if (!res.ok) {
    let parsed: unknown;
    try {
      parsed = await res.json();
    } catch {
      parsed = await res.text();
    }
    throw new ApiError(res.status, parsed);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

/** POST multipart (p. ej. subida a Cloudinary). No fijar `Content-Type`: el runtime añade el boundary. */
export async function postFormData<T>(path: string, formData: FormData): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError(0, `Timeout: el servidor no respondió en ${API_TIMEOUT_MS / 1000}s`);
    }
    throw new ApiError(0, 'Network error');
  }

  if (!res.ok) {
    let parsed: unknown;
    try {
      parsed = await res.json();
    } catch {
      parsed = await res.text();
    }
    throw new ApiError(res.status, parsed);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  del: <T = void>(path: string) => request<T>('DELETE', path),
};
