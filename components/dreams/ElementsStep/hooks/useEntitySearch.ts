import { useEffect, useMemo, useRef, useState } from 'react';

type SearchResult = { id: string; label: string };

/**
 * Generic debounced catalog search hook.
 * Eliminates the repeated query/suggestions/loading pattern for each entity type.
 */
export function useEntitySearch<T>({
  fetchFn,
  getResult,
  rows,
  enabled = true,
  debounceMs = 320,
}: {
  fetchFn: (query: string) => Promise<{ data: T[] }>;
  getResult: (item: T) => SearchResult;
  /** Current selected rows — used to exclude already-added IDs from suggestions. */
  rows: Array<{ t: string; id?: string }>;
  enabled?: boolean;
  debounceMs?: number;
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Keep callbacks stable — avoids re-running the search effect when inline lambdas re-create
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;
  const getResultRef = useRef(getResult);
  getResultRef.current = getResult;

  const existingIds = useMemo(() => {
    const ids = new Set<string>();
    for (const r of rows) {
      if (r.t === 'existing' && r.id) ids.add(r.id);
    }
    return ids;
  }, [rows]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1 || !enabled) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      void fetchRef
        .current(q)
        .then((res) => {
          if (!cancelled) {
            setSuggestions(
              res.data.map(getResultRef.current).filter((x) => !existingIds.has(x.id)),
            );
          }
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, debounceMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, existingIds, enabled, debounceMs]);

  return { query, setQuery, suggestions, setSuggestions, loading };
}
