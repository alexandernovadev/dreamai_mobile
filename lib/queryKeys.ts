import type { SignalEntityListSlug } from '@/services/signalEntities';

/**
 * Centralized TanStack Query keys — use these everywhere to enable invalidation.
 * Prefix per domain (`signals`, `dreamSessions`, …).
 */
export const queryKeys = {
  signals: {
    all: ['signals'] as const,
    hub: () => [...queryKeys.signals.all, 'hub'] as const,
    catalogList: (slug: SignalEntityListSlug) =>
      [...queryKeys.signals.all, 'catalog', slug, 'list'] as const,
    catalogDetail: (slug: SignalEntityListSlug, id: string) =>
      [...queryKeys.signals.all, 'catalog', slug, 'detail', id] as const,
  },
  dreamSessions: {
    all: ['dreamSessions'] as const,
    list: (params: { page: number; limit: number }) =>
      [...queryKeys.dreamSessions.all, 'list', params] as const,
    detail: (id: string) =>
      [...queryKeys.dreamSessions.all, 'detail', id] as const,
    /** Hydrated editor payload (getHydrated). */
    hydrated: (id: string) =>
      [...queryKeys.dreamSessions.all, 'hydrated', id] as const,
    /** Home / dashboard global (sin rango de fechas). */
    analyticsOverview: () =>
      [...queryKeys.dreamSessions.all, 'analytics', 'overview'] as const,
  },
} as const;
