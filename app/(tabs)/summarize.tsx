import { useMemo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenShell } from '@/components/layout/ScreenShell';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { Modal } from '@/components/ui/Modal';
import { Radio } from '@/components/ui/Radio';
import { Select, WebDateInput, type SelectOption } from '@/components/ui';
import {
  apiErrorMessage,
  dreamSessionsService,
  type SummarizeRecentLimit,
} from '@/services';
import { colors, radius, spacing, typography } from '@/theme';

const LIMIT_OPTIONS: SelectOption[] = [5, 10, 15, 20].map((n) => ({
  value: String(n),
  label: `${n} sueños`,
}));

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function isoDateLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function defaultDateFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return isoDateLocal(d);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type SummarizeMode = 'limit' | 'dates';

export default function SummarizeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [mode, setMode] = useState<SummarizeMode>('limit');
  const [limitChoice, setLimitChoice] = useState<string>('10');
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(() => isoDateLocal(new Date()));
  const [summary, setSummary] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    count: number;
    withNarrativeCount: number;
    capped?: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filterSummary = useMemo(() => {
    if (mode === 'limit') {
      return `Últimos ${limitChoice} por fecha del sueño (más recientes primero)`;
    }
    return `${dateFrom} → ${dateTo} (día local)`;
  }, [mode, limitChoice, dateFrom, dateTo]);

  const markdownStyles = useMemo(
    () => ({
      body: {
        color: colors.text,
        fontSize: typography.sizes.md,
        lineHeight: Math.round(typography.sizes.md * 1.55),
      },
      heading2: {
        color: colors.accent,
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
      },
      paragraph: {
        marginTop: 0,
        marginBottom: spacing.sm,
        color: colors.text,
        fontSize: typography.sizes.md,
        lineHeight: Math.round(typography.sizes.md * 1.55),
      },
      bullet_list: {
        marginTop: spacing.xs,
        marginBottom: spacing.sm,
      },
      ordered_list: {
        marginTop: spacing.xs,
        marginBottom: spacing.sm,
      },
      list_item: {
        marginBottom: spacing.xs,
        color: colors.text,
        fontSize: typography.sizes.md,
        lineHeight: Math.round(typography.sizes.md * 1.55),
      },
      bullet_list_icon: {
        color: colors.accentMuted,
        fontSize: typography.sizes.md,
      },
      strong: {
        color: colors.textSecondary,
        fontWeight: typography.weights.semibold,
      },
      em: {
        color: colors.textMuted,
        fontStyle: 'italic' as const,
      },
      blockquote: {
        backgroundColor: 'rgba(124, 92, 196, 0.1)',
        borderLeftColor: colors.accent,
        borderLeftWidth: 3,
        paddingLeft: spacing.md,
        paddingVertical: spacing.sm,
        marginVertical: spacing.sm,
        borderRadius: radius.sm,
      },
    }),
    [],
  );

  const onSummarize = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === 'dates') {
        if (!ISO_DATE.test(dateFrom.trim()) || !ISO_DATE.test(dateTo.trim())) {
          setError('Usa fechas en formato YYYY-MM-DD.');
          return;
        }
        if (dateFrom > dateTo) {
          setError('La fecha "hasta" debe ser igual o posterior a "desde".');
          return;
        }
        const res = await dreamSessionsService.summarizeRecent({
          dreamDateFrom: dateFrom.trim(),
          dreamDateTo: dateTo.trim(),
        });
        setSummary(res.summary);
        setMeta({
          count: res.count,
          withNarrativeCount: res.withNarrativeCount,
          capped: res.capped,
        });
      } else {
        const limit = Number(limitChoice) as SummarizeRecentLimit;
        const res = await dreamSessionsService.summarizeRecent({ limit });
        setSummary(res.summary);
        setMeta({
          count: res.count,
          withNarrativeCount: res.withNarrativeCount,
          capped: res.capped,
        });
      }
    } catch (e) {
      setSummary(null);
      setMeta(null);
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [mode, limitChoice, dateFrom, dateTo]);

  const filterBody = (
    <View style={styles.modalBody}>
      <Text style={styles.modalSectionLabel}>Modo</Text>
      <View style={styles.modeRow}>
        <Radio
          label="Por cantidad"
          selected={mode === 'limit'}
          onPress={() => setMode('limit')}
          disabled={loading}
        />
        <Radio
          label="Por fechas"
          selected={mode === 'dates'}
          onPress={() => setMode('dates')}
          disabled={loading}
        />
      </View>

      {mode === 'limit' ? (
        <Select
          label="Sueños a incluir"
          options={LIMIT_OPTIONS}
          value={limitChoice}
          onValueChange={setLimitChoice}
          placeholder="Cantidad"
          modalTitle="Cantidad de sueños"
          disabled={loading}
        />
      ) : (
        <View style={styles.datesBlock}>
          <Text style={styles.datesHint}>
            Fecha del sueño guardada en el diario. El rango usa el calendario de este dispositivo
            (inicio y fin de cada día local), no solo UTC.
          </Text>
          {Platform.OS === 'web' ? (
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <WebDateInput
                  label="Desde"
                  value={dateFrom}
                  onChangeValue={setDateFrom}
                  disabled={loading}
                />
              </View>
              <View style={styles.dateField}>
                <WebDateInput
                  label="Hasta"
                  value={dateTo}
                  onChangeValue={setDateTo}
                  disabled={loading}
                />
              </View>
            </View>
          ) : (
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Desde (YYYY-MM-DD)</Text>
                <TextInput
                  value={dateFrom}
                  onChangeText={setDateFrom}
                  placeholder="2025-01-01"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  style={styles.nativeDateInput}
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Hasta (YYYY-MM-DD)</Text>
                <TextInput
                  value={dateTo}
                  onChangeText={setDateTo}
                  placeholder="2025-01-31"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  style={styles.nativeDateInput}
                />
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );

  return (
    <ScreenShell>
      <View
        style={[
          styles.screen,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Summarize</Text>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir filtros del análisis"
              onPress={() => setFilterModalOpen(true)}
              disabled={loading}
              style={({ pressed }) => [
                styles.headerBtn,
                loading && styles.headerBtnDisabled,
                pressed && !loading && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="options-outline" size={18} color={colors.accent} />
              <Text style={styles.headerBtnLabel}>Filter</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Generar resumen con DreamAI"
              onPress={() => void onSummarize()}
              disabled={loading}
              style={({ pressed }) => [
                styles.aiBtn,
                loading && styles.headerBtnDisabled,
                pressed && !loading && { opacity: 0.85 },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Ionicons name="sparkles" size={18} color={colors.text} />
              )}
            </Pressable>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {meta ? (
          <View style={styles.metaBox}>
            <Text style={styles.metaText}>
              <Text style={styles.metaStrong}>{meta.count}</Text> sueño(s) en el criterio ·{' '}
              <Text style={styles.metaStrong}>{meta.withNarrativeCount}</Text> con narrativa en el
              análisis
              {meta.capped ? (
                <Text style={styles.metaMuted}>
                  {' '}
                  (hay más en el rango en la base de datos; la IA usa como máximo 500)
                </Text>
              ) : null}
            </Text>
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.resultScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {summary ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Resumen</Text>
              <Markdown style={markdownStyles} mergeStyle>
                {summary}
              </Markdown>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="sparkles-outline" size={36} color={colors.accent} />
              </View>
              <Text style={styles.emptyStateTitle}>Pantalla lista para resumir</Text>
              <Text style={styles.emptyStateText}>
                Usa `Filter` para elegir el rango y luego toca el boton de AI para generar el resumen.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      <Modal
        visible={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title="Filtros del análisis"
        closeLabel="Cancelar"
        primaryLabel="Listo"
        onPrimaryPress={() => setFilterModalOpen(false)}
      >
        {filterBody}
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  backBtn: {
    marginLeft: -spacing.xs,
    padding: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.28)',
    backgroundColor: 'rgba(124, 92, 196, 0.12)',
  },
  aiBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.42)',
    backgroundColor: 'rgba(124, 92, 196, 0.28)',
  },
  headerBtnDisabled: {
    opacity: 0.55,
  },
  headerBtnLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
  },
  modalBody: {
    gap: spacing.lg,
  },
  modalSectionLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  datesBlock: {
    gap: spacing.sm,
  },
  datesHint: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  dateField: {
    flex: 1,
    minWidth: 140,
    gap: spacing.xs,
  },
  dateLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  nativeDateInput: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    fontSize: typography.sizes.md,
  },
  errorBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(232, 93, 106, 0.12)',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.danger,
  },
  metaBox: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(124, 92, 196, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.25)',
  },
  metaText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  metaStrong: {
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  metaMuted: {
    color: colors.textMuted,
  },
  resultScroll: {
    flexGrow: 1,
  },
  resultCard: {
    flex: 1,
    minHeight: '100%',
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
  },
  resultLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emptyStateIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 92, 196, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.24)',
  },
  emptyStateTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
