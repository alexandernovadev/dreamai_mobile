import { api } from './api';
import { buildQuery, type PaginatedMeta } from './query';
import type { SignalEntityListSlug } from './signalEntities';
import type { SignalHubCardItem } from './signalsHub';

export const ENTITY_CATALOG_PAGE_SIZE = 20;

/**
 * One HTTP call: paginated catalog + appearance counts (`GET /signals/catalog/:entity`).
 */
export async function fetchEntityListPage(
  slug: SignalEntityListSlug,
  page: number,
  limit: number = ENTITY_CATALOG_PAGE_SIZE,
): Promise<{ items: SignalHubCardItem[]; meta: PaginatedMeta }> {
  const raw = await api.get<{
    data: SignalHubCardItem[];
    meta: PaginatedMeta;
  }>(
    `/signals/catalog/${encodeURIComponent(slug)}${buildQuery({ page, limit })}`,
  );
  return { items: raw.data, meta: raw.meta };
}
