import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Redirect,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { DreamTab } from "@/components/dreams/DreamSessionReadView";
import { ScreenShell } from '@/components/layout/ScreenShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { DreamSessionReadView } from '@/components/dreams/DreamSessionReadView';
import { AsyncState } from '@/components/ui';
import { queryKeys } from '@/lib/queryKeys';
import { apiErrorMessage, dreamSessionsService } from '@/services';
import { colors, spacing, typography } from '@/theme';

/**
 * Detalle del sueño en solo lectura: narrativa, imágenes, reflexión, análisis y
 * pestaña Elementos (catálogo Signals). La edición está en `/dream/edit/:id`.
 */
export default function DreamDetailScreen() {
  const { id, tab: tabParam } = useLocalSearchParams<{
    id: string;
    tab?: DreamTab;
  }>();
  const raw = Array.isArray(id) ? id[0] : id;
  const activeTab = tabParam === "elements" ? "elements" : "dream";
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const skipNextFocusRefetch = useRef(true);

  useEffect(() => {
    skipNextFocusRefetch.current = true;
  }, [raw]);

  const hydratedQuery = useQuery({
    queryKey: queryKeys.dreamSessions.hydrated(raw ?? ''),
    queryFn: () => dreamSessionsService.getHydrated(raw!),
    enabled:
      !!raw && raw !== 'edit' && raw !== 'new',
  });

  useFocusEffect(
    useCallback(() => {
      if (!raw || raw === 'edit' || raw === 'new') return;
      if (skipNextFocusRefetch.current) {
        skipNextFocusRefetch.current = false;
        return;
      }
      void hydratedQuery.refetch();
    }, [raw, hydratedQuery.refetch]),
  );

  const session = hydratedQuery.data?.session ?? null;
  const hydratedMaps = hydratedQuery.data?.hydrated ?? null;
  const loading = hydratedQuery.isPending;
  const error = hydratedQuery.error ? apiErrorMessage(hydratedQuery.error) : null;

  if (!raw) {
    return null;
  }

  if (raw === 'edit' || raw === 'new') {
    return <Redirect href="/dream" />;
  }

  function handleTabChange(tab: DreamTab) {
    router.setParams({ tab });
  }

  return (
    <ScreenShell style={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom }}>
        <ScreenHeader
          title="Sueño"
          subtitle="Lectura"
          onBack={() => router.back()}
        />

        <AsyncState
          loading={loading}
          error={error}
          onRetry={() => void hydratedQuery.refetch()}
        />
        {!loading && !error && session && hydratedMaps && (
          <DreamSessionReadView
            session={session}
            hydrated={hydratedMaps}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            returnToBase={`/dream/${raw}${activeTab === 'elements' ? '?tab=elements' : ''}`}
          />
        )}
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  screenContent: {
    flex: 1,
  },
});
