import type { Character } from '@/lib/docs/types/character';
import type { Location } from '@/lib/docs/types/location';
import type { DreamObject } from '@/lib/docs/types/dream-object';
import type { DreamSession } from '@/lib/docs/types/dream';
import { api } from './api';

// --------------- Characters ---------------

export const catalogCharacters = {
  list: () => api.get<Character[]>('/catalog/characters'),
  get: (id: string) => api.get<Character>(`/catalog/characters/${id}`),
  create: (data: Omit<Character, 'id'>) =>
    api.post<Character>('/catalog/characters', data),
  update: (id: string, data: Partial<Character>) =>
    api.patch<Character>(`/catalog/characters/${id}`, data),
  remove: (id: string) => api.del(`/catalog/characters/${id}`),
  dreamSessions: (id: string) =>
    api.get<DreamSession[]>(`/catalog/characters/${id}/dream-sessions`),
};

// --------------- Locations ---------------

export const catalogLocations = {
  list: () => api.get<Location[]>('/catalog/locations'),
  get: (id: string) => api.get<Location>(`/catalog/locations/${id}`),
  create: (data: Omit<Location, 'id'>) =>
    api.post<Location>('/catalog/locations', data),
  update: (id: string, data: Partial<Location>) =>
    api.patch<Location>(`/catalog/locations/${id}`, data),
  remove: (id: string) => api.del(`/catalog/locations/${id}`),
  dreamSessions: (id: string) =>
    api.get<DreamSession[]>(`/catalog/locations/${id}/dream-sessions`),
};

// --------------- Objects ---------------

export const catalogObjects = {
  list: () => api.get<DreamObject[]>('/catalog/objects'),
  get: (id: string) => api.get<DreamObject>(`/catalog/objects/${id}`),
  create: (data: Omit<DreamObject, 'id'>) =>
    api.post<DreamObject>('/catalog/objects', data),
  update: (id: string, data: Partial<DreamObject>) =>
    api.patch<DreamObject>(`/catalog/objects/${id}`, data),
  remove: (id: string) => api.del(`/catalog/objects/${id}`),
  dreamSessions: (id: string) =>
    api.get<DreamSession[]>(`/catalog/objects/${id}/dream-sessions`),
};
