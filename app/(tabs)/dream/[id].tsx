import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell } from '@/components/layout/ScreenShell';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { DreamSessionReadView } from '@/components/dreams/DreamSessionReadView';
import { queryKeys } from '@/lib/queryKeys';
import { apiErrorMessage, dreamSessionsService } from '@/services';
import { colors, radius, spacing, typography } from '@/theme';

/**
 * Detalle del sueño en solo lectura: narrativa, imágenes, reflexión, análisis y
 * pestaña Elementos (catálogo Signals). La edición está en `/dream/edit/:id`.
 */
export default function DreamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const raw = Array.isArray(id) ? id[0] : id;
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

  return (
    <ScreenShell style={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom }}>
        <ScreenHeader
          title="Sueño"
          subtitle="Lectura"
          onBack={() => router.back()}
        />

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={s.muted}>Cargando…</Text>
          </View>
        ) : error ? (
          <View style={s.center}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
            <Text style={s.errorText}>{error}</Text>
            <Pressable
              onPress={() => void hydratedQuery.refetch()}
              style={({ pressed }) => [s.retryBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={s.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : session && hydratedMaps ? (
          <DreamSessionReadView session={session} hydrated={hydratedMaps} />
        ) : null}
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
  },
  muted: { fontSize: typography.sizes.sm, color: colors.textMuted },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  retryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.35)',
    backgroundColor: 'rgba(124, 92, 196, 0.12)',
  },
  retryText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
  },
});
