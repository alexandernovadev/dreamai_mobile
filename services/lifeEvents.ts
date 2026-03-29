import type { LifeEvent } from '@/lib/docs/types/life-event';
import type { DreamSession } from '@/lib/docs/types/dream';
import { api } from './api';

type LifeEventDto = Omit<LifeEvent, 'createdAt' | 'updatedAt' | 'occurredAt'> & {
  createdAt: string;
  updatedAt: string;
  occurredAt?: string;
};

function revive(dto: LifeEventDto): LifeEvent {
  return {
    ...dto,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
  };
}

function strip(data: Partial<LifeEvent>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  if (data.occurredAt) {
    out.occurredAt = data.occurredAt.toISOString();
  }
  return out;
}

export const lifeEventsService = {
  async list(): Promise<LifeEvent[]> {
    const raw = await api.get<LifeEventDto[]>('/life-events');
    return raw.map(revive);
  },

  async get(id: string): Promise<LifeEvent> {
    const raw = await api.get<LifeEventDto>(`/life-events/${id}`);
    return revive(raw);
  },

  async create(data: Pick<LifeEvent, 'title' | 'note' | 'occurredAt'>): Promise<LifeEvent> {
    const raw = await api.post<LifeEventDto>('/life-events', strip(data));
    return revive(raw);
  },

  async update(id: string, data: Partial<Pick<LifeEvent, 'title' | 'note' | 'occurredAt'>>): Promise<LifeEvent> {
    const raw = await api.patch<LifeEventDto>(`/life-events/${id}`, strip(data));
    return revive(raw);
  },

  async remove(id: string): Promise<void> {
    await api.del(`/life-events/${id}`);
  },

  async dreamSessions(id: string): Promise<DreamSession[]> {
    return api.get<DreamSession[]>(`/life-events/${id}/dream-sessions`);
  },
};
