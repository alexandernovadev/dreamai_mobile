import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type { SignalEntityListSlug } from '@/services/signalEntities';

export function invalidateSignalsAfterElementSessionSave(
  queryClient: QueryClient,
  touched: ReadonlySet<SignalEntityListSlug>,
  details: readonly { slug: SignalEntityListSlug; id: string }[],
) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.signals.hub() });
  for (const slug of touched) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.signals.catalogList(slug),
    });
  }
  for (const { slug, id } of details) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.signals.catalogDetail(slug, id),
    });
  }
}

export function invalidateSignalsAfterCatalogWrite(
  queryClient: QueryClient,
  slug: SignalEntityListSlug,
  id: string,
) {
  invalidateSignalsAfterElementSessionSave(queryClient, new Set([slug]), [
    { slug, id },
  ]);
}
