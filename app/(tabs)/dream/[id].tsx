import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DreamSessionReadView } from '@/components/dreams/DreamSessionReadView';
import { queryKeys } from '@/lib/queryKeys';
import { apiErrorMessage, dreamSessionsService } from '@/services';
import { colors, gradients, radius, spacing, typography } from '@/theme';

/**
 * Detalle del sueño en solo lectura: narrativa, imágenes, reflexión, análisis y
 * pestaña Elementos (catálogo Signals). La edición está en `/dream/edit/:id`.
 */
export default function DreamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const raw = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const bg = gradients.background;
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
    <LinearGradient
      colors={[...bg.colors]}
      start={bg.start}
      end={bg.end}
      style={s.root}
    >
      <View style={[s.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={s.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.5 }]}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </Pressable>
          <View style={s.headerText}>
            <Text style={s.title}>Sueño</Text>
            <Text style={s.subtitle}>Lectura</Text>
          </View>
        </View>

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
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  backBtn: { marginLeft: -spacing.xs, padding: spacing.xs },
  headerText: { flex: 1 },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
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
