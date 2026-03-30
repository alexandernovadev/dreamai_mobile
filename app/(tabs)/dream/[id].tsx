import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DreamDetailForm } from '@/components/dreams/DreamDetailForm';
import { Modal } from '@/components/ui/Modal';
import { DREAM_LIST_QUERY_PARAMS } from '@/lib/dreamListQuery';
import { queryKeys } from '@/lib/queryKeys';
import { apiErrorMessage, dreamSessionsService, type DreamSession } from '@/services';
import { colors, gradients, radius, spacing, typography } from '@/theme';

/**
 * Detalle del sueño: edición de `timestamp`, `dreamKind`, `dreamImages` (subida Cloudinary).
 * El flujo paso a paso está en `/dream/edit/:id`.
 */
export default function DreamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const raw = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const bg = gradients.background;
  const insets = useSafeAreaInsets();

  const [saveError, setSaveError] = useState<{
    message: string;
    kind: 'network' | 'server';
  } | null>(null);

  const detailQuery = useQuery({
    queryKey: queryKeys.dreamSessions.detail(raw ?? ''),
    queryFn: () => dreamSessionsService.getOne(raw!),
    enabled:
      !!raw && raw !== 'edit' && raw !== 'new',
  });

  const session = detailQuery.data ?? null;
  const loading = detailQuery.isPending;
  const error = detailQuery.error ? apiErrorMessage(detailQuery.error) : null;

  const onDreamSaved = (next: DreamSession) => {
    queryClient.setQueryData(queryKeys.dreamSessions.detail(next.id), next);
    void queryClient.invalidateQueries({
      queryKey: queryKeys.dreamSessions.list(DREAM_LIST_QUERY_PARAMS),
    });
  };

  if (!raw) {
    return null;
  }

  if (raw === 'edit' || raw === 'new') {
    return <Redirect href="/dream" />;
  }

  return (
    <>
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
              <Text style={s.title}>Detalle</Text>
              <Text style={s.subtitle}>Fecha, tipo e imágenes</Text>
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
                onPress={() => void detailQuery.refetch()}
                style={({ pressed }) => [s.retryBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={s.retryText}>Reintentar</Text>
              </Pressable>
            </View>
          ) : session ? (
            <DreamDetailForm
              sessionId={session.id}
              initialTimestamp={session.timestamp}
              initialDreamKind={session.dreamKind}
              initialDreamImages={session.dreamImages}
              onSaved={onDreamSaved}
              onError={(message, kind) => setSaveError({ message, kind })}
            />
          ) : null}
        </View>
      </LinearGradient>

      <Modal
        visible={saveError !== null}
        onClose={() => setSaveError(null)}
        title="No se pudo guardar"
        closeLabel="Entendido"
      >
        {saveError ? (
          <View style={s.modalBody}>
            <View
              style={[
                s.errIconWrap,
                saveError.kind === 'network' && s.errIconWrapNet,
              ]}
            >
              <Ionicons
                name={
                  saveError.kind === 'network'
                    ? 'cloud-offline-outline'
                    : 'alert-circle-outline'
                }
                size={44}
                color={
                  saveError.kind === 'network' ? colors.info : colors.danger
                }
              />
            </View>
            <Text style={s.modalMsg}>{saveError.message}</Text>
          </View>
        ) : null}
      </Modal>
    </>
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
  modalBody: { alignItems: 'center', gap: spacing.md },
  errIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232, 93, 106, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232, 93, 106, 0.25)',
  },
  errIconWrapNet: {
    backgroundColor: 'rgba(109, 179, 255, 0.12)',
    borderColor: 'rgba(109, 179, 255, 0.28)',
  },
  modalMsg: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
