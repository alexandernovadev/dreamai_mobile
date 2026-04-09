import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenShell } from '@/components/layout/ScreenShell';
import { Ionicons } from '@expo/vector-icons';
import { queryKeys } from '@/lib/queryKeys';
import {
  apiErrorMessage,
  dreamSessionsService,
  type DreamAnalyticsOverview,
  type DreamAnalyticsTopEntity,
} from '@/services';
import { colors, radius, spacing, typography } from '@/theme';

const CATALOG_ROWS: {
  key: keyof DreamAnalyticsOverview['catalogTotals'];
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'characters', label: 'Personajes', icon: 'people-outline' },
  { key: 'locations', label: 'Lugares', icon: 'map-outline' },
  { key: 'objects', label: 'Objetos', icon: 'cube-outline' },
  { key: 'events', label: 'Eventos', icon: 'flash-outline' },
  { key: 'contextLife', label: 'Contexto de vida', icon: 'briefcase-outline' },
  { key: 'feelings', label: 'Emociones', icon: 'heart-outline' },
];

function LucidityChart({ bins }: { bins: DreamAnalyticsOverview['lucidityHistogram'] }) {
  const max = Math.max(1, ...bins.map((b) => b.count));
  const hasAny = bins.some((b) => b.count > 0);

  return (
    <View style={chart.card}>
      <Text style={chart.title}>Lucidez en sueños (0–10)</Text>
      {!hasAny ? (
        <Text style={chart.empty}>Aún no hay sueños con lucidez registrada.</Text>
      ) : (
        <View style={chart.row}>
          {bins.map((b) => {
            const h = Math.max(6, Math.round((b.count / max) * 72));
            return (
              <View key={b.level} style={chart.col}>
                <View style={chart.barTrack}>
                  <View style={[chart.barFill, { height: h }]} />
                </View>
                <Text style={chart.barLabel}>{b.level}</Text>
                <Text style={chart.barCount}>{b.count}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function TopList({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  rows: DreamAnalyticsTopEntity[];
}) {
  return (
    <View style={top.card}>
      <View style={top.head}>
        <Ionicons name={icon} size={18} color={colors.accent} />
        <Text style={top.title}>{title}</Text>
      </View>
      {rows.length === 0 ? (
        <Text style={top.empty}>Sin datos aún.</Text>
      ) : (
        rows.map((r, i) => (
          <View
            key={r.id}
            style={[top.row, i < rows.length - 1 && top.rowBorder]}
          >
            <Text style={top.rank}>{i + 1}</Text>
            <Text style={top.name} numberOfLines={1}>
              {r.name}
            </Text>
            <Text style={top.count}>{r.count}×</Text>
          </View>
        ))
      )}
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const analyticsQuery = useQuery({
    queryKey: queryKeys.dreamSessions.analyticsOverview(),
    queryFn: () => dreamSessionsService.getAnalyticsOverview(),
  });

  const data = analyticsQuery.data ?? null;
  const err = analyticsQuery.error ? apiErrorMessage(analyticsQuery.error) : null;
  const loading = analyticsQuery.isPending;

  return (
    <ScreenShell>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.scrollContent,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={analyticsQuery.isFetching && !analyticsQuery.isPending}
            onRefresh={() => void analyticsQuery.refetch()}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Text style={s.title}>Home</Text>
          <View style={s.subtitleRow}>
            <Ionicons name="stats-chart-outline" size={14} color={colors.textMuted} />
            <Text style={s.subtitle}>Resumen global</Text>
          </View>
        </View>

        {loading && !data ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={s.muted}>Cargando estadísticas…</Text>
          </View>
        ) : err && !data ? (
          <View style={s.center}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
            <Text style={s.error}>{err}</Text>
            <Pressable
              onPress={() => void analyticsQuery.refetch()}
              style={({ pressed }) => [s.retry, pressed && { opacity: 0.85 }]}
            >
              <Text style={s.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : data ? (
          <>
            <View style={s.statHero}>
              <Ionicons name="moon-outline" size={28} color={colors.accent} />
              <Text style={s.statHeroValue}>{data.dreamCount}</Text>
              <Text style={s.statHeroLabel}>sueños registrados</Text>
              <Text style={s.statHint}>Toda la vida · sin filtro de fechas</Text>
            </View>

            <Text style={s.sectionLabel}>Entidades en catálogo</Text>
            <View style={s.gridCard}>
              {CATALOG_ROWS.map(({ key, label, icon }) => (
                <View key={key} style={s.gridRow}>
                  <View style={s.gridRowLeft}>
                    <Ionicons name={icon} size={18} color={colors.textSecondary} />
                    <Text style={s.gridLabel}>{label}</Text>
                  </View>
                  <Text style={s.gridValue}>{data.catalogTotals[key]}</Text>
                </View>
              ))}
            </View>

            <LucidityChart bins={data.lucidityHistogram} />

            <Text style={s.sectionLabel}>Más vistos en tus sueños</Text>
            <TopList
              title="Personajes"
              icon="people-outline"
              rows={data.topCharacters}
            />
            <TopList
              title="Lugares"
              icon="map-outline"
              rows={data.topLocations}
            />
            <TopList
              title="Objetos"
              icon="cube-outline"
              rows={data.topObjects}
            />
          </>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  header: { marginBottom: spacing.sm },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  subtitle: { fontSize: typography.sizes.sm, color: colors.textMuted },
  sectionLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
  center: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
  },
  muted: { fontSize: typography.sizes.sm, color: colors.textMuted },
  error: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retry: {
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
  statHero: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.25)',
    backgroundColor: 'rgba(124, 92, 196, 0.08)',
    gap: spacing.xs,
  },
  statHeroValue: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  statHeroLabel: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  statHint: { fontSize: typography.sizes.xs, color: colors.textMuted },
  gridCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.22)',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    overflow: 'hidden',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  gridRowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  gridLabel: { fontSize: typography.sizes.md, color: colors.textSecondary },
  gridValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
});

const chart = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.22)',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  empty: { fontSize: typography.sizes.sm, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 2,
  },
  col: { flex: 1, alignItems: 'center', minWidth: 0 },
  barTrack: {
    width: '100%',
    height: 76,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '75%',
    maxWidth: 14,
    borderRadius: 4,
    backgroundColor: colors.accent,
    opacity: 0.9,
  },
  barLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  barCount: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
});

const top = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.22)',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  empty: { fontSize: typography.sizes.sm, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rank: {
    width: 22,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.accent,
  },
  name: { flex: 1, fontSize: typography.sizes.sm, color: colors.text },
  count: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
});
