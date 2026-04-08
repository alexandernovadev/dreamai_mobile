import { useMemo, useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Radio } from '@/components/ui/Radio';
import { Select, WebDateInput, type SelectOption } from '@/components/ui';
import {
  apiErrorMessage,
  dreamSessionsService,
  type SummarizeRecentLimit,
} from '@/services';
import { colors, gradients, radius, spacing, typography } from '@/theme';

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
  const bg = gradients.background;
  const insets = useSafeAreaInsets();
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
    <LinearGradient
      colors={[...bg.colors]}
      start={bg.start}
      end={bg.end}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons name="sparkles-outline" size={28} color={colors.accent} />
          <Text style={styles.title}>Summarize</Text>
       
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir filtros del análisis"
          onPress={() => setFilterModalOpen(true)}
          disabled={loading}
          style={({ pressed }) => [
            styles.filterCard,
            pressed && styles.filterCardPressed,
            loading && styles.filterCardDisabled,
          ]}
        >
          <View style={styles.filterCardLeft}>
            <View style={styles.filterIconWrap}>
              <Ionicons name="options-outline" size={22} color={colors.accent} />
            </View>
            <View style={styles.filterCardText}>
              <Text style={styles.filterCardLabel}>Filtros del análisis</Text>
              <Text style={styles.filterCardValue} numberOfLines={2}>
                {filterSummary}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
        </Pressable>

        <Button
          onPress={() => void onSummarize()}
          disabled={loading}
          loading={loading}
          loadingLabel="Analizando sueños…"
        >
          Summarize
        </Button>

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

        {summary ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Resumen</Text>
            <Markdown style={markdownStyles} mergeStyle>
              {summary}
            </Markdown>
          </View>
        ) : null}
      </ScrollView>

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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
    display:'flex',
    flexDirection:'row'
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  filterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.28)',
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
  },
  filterCardPressed: {
    opacity: 0.92,
  },
  filterCardDisabled: {
    opacity: 0.55,
  },
  filterCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    minWidth: 0,
  },
  filterIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(124, 92, 196, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCardText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  filterCardLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  filterCardValue: {
    fontSize: typography.sizes.md,
    color: colors.text,
    lineHeight: 22,
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
  resultCard: {
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
});
