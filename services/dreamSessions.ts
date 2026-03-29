import type { DreamSession } from '@/lib/docs/types/dream';
import { api } from './api';

/** Shape the backend returns (timestamp is ISO string). */
type DreamSessionDto = Omit<DreamSession, 'timestamp'> & { timestamp: string };

function revive(dto: DreamSessionDto): DreamSession {
  return { ...dto, timestamp: new Date(dto.timestamp) };
}

function strip(s: Partial<DreamSession>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...s };
  if (s.timestamp) {
    out.timestamp = s.timestamp.toISOString();
  }
  if (Array.isArray(s.dreamKind)) {
    out.dreamKind = s.dreamKind.length === 1 ? s.dreamKind[0] : 'MIXED';
  }
  return out;
}

export type ListDreamSessionsQuery = {
  catalogCharacterId?: string;
  catalogLocationId?: string;
  catalogObjectId?: string;
  lifeEventId?: string;
};

function buildQuery(q?: ListDreamSessionsQuery): string {
  if (!q) return '';
  const params = new URLSearchParams();
  if (q.catalogCharacterId) params.set('catalogCharacterId', q.catalogCharacterId);
  if (q.catalogLocationId) params.set('catalogLocationId', q.catalogLocationId);
  if (q.catalogObjectId) params.set('catalogObjectId', q.catalogObjectId);
  if (q.lifeEventId) params.set('lifeEventId', q.lifeEventId);
  const str = params.toString();
  return str ? `?${str}` : '';
}

export const dreamSessionsService = {
  async list(query?: ListDreamSessionsQuery): Promise<DreamSession[]> {
    const raw = await api.get<DreamSessionDto[]>(
      `/dream-sessions${buildQuery(query)}`,
    );
    return raw.map(revive);
  },

  async get(id: string): Promise<DreamSession> {
    const raw = await api.get<DreamSessionDto>(`/dream-sessions/${id}`);
    return revive(raw);
  },

  async create(session: Omit<DreamSession, 'id'>): Promise<DreamSession> {
    const raw = await api.post<DreamSessionDto>(
      '/dream-sessions',
      strip(session),
    );
    return revive(raw);
  },

  async update(
    id: string,
    patch: Partial<DreamSession>,
  ): Promise<DreamSession> {
    const raw = await api.patch<DreamSessionDto>(
      `/dream-sessions/${id}`,
      strip(patch),
    );
    return revive(raw);
  },

  async remove(id: string): Promise<void> {
    await api.del(`/dream-sessions/${id}`);
  },
};
