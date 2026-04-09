import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell } from '@/components/layout/ScreenShell';
import { API_BASE_URL } from '@/services/config';
import {
  apiErrorMessage,
  fetchBackendMeta,
  type BackendMeta,
} from '@/services';
import { getClientBuildInfo } from '@/lib/buildInfo';
import { colors, palette, radius, spacing, typography } from '@/theme';

function formatBuildDate(iso: string): string {
  if (!iso?.trim()) return '—';
  try {
    return new Intl.DateTimeFormat('es', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function envLabel(e: string): string {
  const x = e.toLowerCase();
  if (x === 'production') return 'Producción';
  if (x === 'development') return 'Desarrollo';
  if (x === 'test') return 'Pruebas';
  if (x === 'preview' || x === 'staging') return 'Preview / staging';
  return e;
}

function envPillColors(raw: string): { bg: string; border: string; text: string } {
  const x = raw.toLowerCase();
  if (x === 'production') {
    return {
      bg: 'rgba(93, 214, 138, 0.14)',
      border: 'rgba(93, 214, 138, 0.45)',
      text: palette.semantic.success,
    };
  }
  if (x === 'development') {
    return {
      bg: 'rgba(109, 179, 255, 0.12)',
      border: 'rgba(109, 179, 255, 0.4)',
      text: palette.semantic.info,
    };
  }
  if (x === 'test') {
    return {
      bg: 'rgba(232, 179, 93, 0.12)',
      border: 'rgba(232, 179, 93, 0.4)',
      text: palette.semantic.warning,
    };
  }
  return {
    bg: 'rgba(124, 92, 196, 0.18)',
    border: 'rgba(157, 130, 224, 0.45)',
    text: palette.purple[200],
  };
}

function EnvPill({ value }: { value: string }) {
  const c = envPillColors(value);
  return (
    <View style={[pillStyles.wrap, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={[pillStyles.dot, { backgroundColor: c.text }]} />
      <Text style={[pillStyles.text, { color: c.text }]}>{envLabel(value)}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});

type RowSpec = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Si es ambiente, mostrar pill en lugar de texto plano */
  env?: boolean;
};

function InfoCard({
  title,
  icon,
  accent,
  accentSoft,
  gradientStops,
  rows,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  accentSoft: string;
  gradientStops: readonly [string, string];
  rows: RowSpec[];
}) {
  return (
    <View style={styles.cardOuter}>
      <LinearGradient
        colors={[...gradientStops]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradientBorder}
      >
        <View style={[styles.cardInner, { borderColor: accentSoft }]}>
          <LinearGradient
            colors={[accentSoft, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.cardHeaderBg}
          >
            <View style={[styles.cardIconRing, { borderColor: accent + '55' }]}>
              <LinearGradient
                colors={[accentSoft, 'transparent']}
                style={styles.cardIconGrad}
              >
                <Ionicons name={icon} size={22} color={accent} />
              </LinearGradient>
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
          </LinearGradient>

          <View style={styles.cardBody}>
            {rows.map((r, i) => (
              <View
                key={r.label}
                style={[
                  styles.dataRow,
                  i > 0 && styles.dataRowBorder,
                  i % 2 === 1 && styles.dataRowAlt,
                ]}
              >
                <View style={styles.dataRowTop}>
                  <View style={styles.dataRowLeft}>
                    <View style={[styles.rowIconBox, { backgroundColor: accent + '18' }]}>
                      <Ionicons name={r.icon} size={16} color={accent} />
                    </View>
                    <Text style={styles.dataLabel}>{r.label}</Text>
                  </View>
                  {r.env ? <EnvPill value={r.value} /> : null}
                </View>
                {!r.env ? (
                  <Text style={styles.dataValue} selectable numberOfLines={6}>
                    {r.value}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

export default function SystemInfoScreen() {
  const insets = useSafeAreaInsets();
  const client = getClientBuildInfo();
  const [backendMeta, setBackendMeta] = useState<BackendMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      setBackendMeta(await fetchBackendMeta());
    } catch (e) {
      setBackendMeta(null);
      setErr(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const frontRows: RowSpec[] = [
    { label: 'Servicio', value: client.serviceName, icon: 'cube-outline' },
    { label: 'Versión', value: client.version, icon: 'pricetag-outline' },
    { label: 'Build', value: formatBuildDate(client.buildAt), icon: 'calendar-outline' },
    { label: 'Ambiente', value: client.environment, icon: 'planet-outline', env: true },
    { label: 'Commit', value: client.commit || '—', icon: 'git-branch-outline' },
  ];

  const backRows: RowSpec[] = backendMeta
    ? [
        { label: 'Servicio', value: backendMeta.serviceName, icon: 'cube-outline' },
        { label: 'Versión', value: backendMeta.version, icon: 'pricetag-outline' },
        {
          label: 'Build',
          value: formatBuildDate(backendMeta.buildAt),
          icon: 'calendar-outline',
        },
        {
          label: 'Ambiente',
          value: backendMeta.environment,
          icon: 'planet-outline',
          env: true,
        },
        { label: 'Commit', value: backendMeta.commit || '—', icon: 'git-branch-outline' },
      ]
    : [];

  const frontAccent = palette.purple[300];
  const frontSoft = 'rgba(157, 130, 224, 0.14)';
  const backAccent = palette.semantic.info;
  const backSoft = 'rgba(109, 179, 255, 0.12)';

  return (
    <ScreenShell>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <LinearGradient
            colors={['rgba(124, 92, 196, 0.35)', 'rgba(109, 179, 255, 0.12)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGlow}
          />
          <View style={styles.heroIconWrap}>
            <Ionicons name="layers-outline" size={26} color={palette.purple[200]} />
          </View>
          <Text style={styles.heroTitle}>Build y despliegue</Text>
          <Text style={styles.heroSubtitle}>
            Cliente embebido en el bundle y API en vivo. La fecha del cliente refleja el último{' '}
            <Text style={styles.heroCode}>build-info</Text> antes del empaquetado.
          </Text>
        </View>

        <InfoCard
          title="Cliente (Expo)"
          icon="phone-portrait-outline"
          accent={frontAccent}
          accentSoft={frontSoft}
          gradientStops={['rgba(157, 130, 224, 0.5)', 'rgba(91, 61, 158, 0.25)']}
          rows={frontRows}
        />

        <View style={styles.urlCard}>
          <View style={styles.urlRow}>
            <Ionicons name="link-outline" size={18} color={palette.semantic.info} />
            <Text style={styles.urlLabel}>Base URL</Text>
          </View>
          <Text style={styles.urlValue} selectable>
            {API_BASE_URL}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={palette.purple[300]} />
            <Text style={styles.loadingText}>Sincronizando con el API…</Text>
            <Text style={styles.loadingHint}>Comprobando versión del servidor</Text>
          </View>
        ) : err ? (
          <LinearGradient
            colors={['rgba(232, 93, 106, 0.25)', 'rgba(232, 93, 106, 0.06)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.errOuter}
          >
            <View style={styles.errInner}>
              <View style={styles.errIconCircle}>
                <Ionicons name="cloud-offline-outline" size={32} color={palette.semantic.danger} />
              </View>
              <Text style={styles.errTitle}>Sin conexión al backend</Text>
              <Text style={styles.errBody}>{err}</Text>
            </View>
          </LinearGradient>
        ) : backendMeta ? (
          <InfoCard
            title="Servidor (Nest)"
            icon="server-outline"
            accent={backAccent}
            accentSoft={backSoft}
            gradientStops={['rgba(109, 179, 255, 0.45)', 'rgba(91, 61, 158, 0.2)']}
            rows={backRows}
          />
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  hero: {
    marginBottom: spacing.xs,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(157, 130, 224, 0.22)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    overflow: 'hidden',
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(124, 92, 196, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(157, 130, 224, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    lineHeight: 21,
  },
  heroCode: {
    fontFamily: 'monospace',
    color: palette.purple[200],
    fontSize: typography.sizes.sm,
  },
  cardOuter: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  cardGradientBorder: {
    padding: 1,
    borderRadius: radius.xl,
  },
  cardInner: {
    borderRadius: radius.xl - 1,
    backgroundColor: palette.neutral[950],
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeaderBg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  cardIconRing: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardIconGrad: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  cardBody: {
    paddingBottom: spacing.xs,
  },
  dataRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  dataRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  dataRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  dataRowAlt: {
    backgroundColor: 'rgba(255,255,255, 0.02)',
  },
  dataRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flex: 1,
  },
  dataValue: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 22,
    paddingLeft: 38,
  },
  urlCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: 'rgba(109, 179, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(109, 179, 255, 0.22)',
    gap: spacing.sm,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  urlLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.semantic.info,
  },
  urlValue: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  loadingCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(124, 92, 196, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(157, 130, 224, 0.2)',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  loadingHint: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  errOuter: {
    borderRadius: radius.xl,
    padding: 1,
    overflow: 'hidden',
  },
  errInner: {
    borderRadius: radius.xl - 1,
    backgroundColor: palette.neutral[950],
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  errIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(232, 93, 106, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232, 93, 106, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  errTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  errBody: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
});
