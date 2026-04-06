import { useMemo, useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { Button } from '@/components/ui/Button';
import { Select, type SelectOption } from '@/components/ui';
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

export default function SummarizeScreen() {
  const bg = gradients.background;
  const insets = useSafeAreaInsets();
  const [limitChoice, setLimitChoice] = useState<string>('10');
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      const limit = Number(limitChoice) as SummarizeRecentLimit;
      const res = await dreamSessionsService.summarizeRecent({ limit });
      setSummary(res.summary);
    } catch (e) {
      setSummary(null);
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [limitChoice]);

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
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons name="sparkles-outline" size={28} color={colors.accent} />
          <Text style={styles.title}>Summarize</Text>
          <Text style={styles.subtitle}>
            Toma tus últimos sueños con narrativa (elige cuántos abajo) y muestra patrones que se
            repiten, sin guardar nada en el servidor.
          </Text>
        </View>

        <Select
          label="Sueños a incluir"
          options={LIMIT_OPTIONS}
          value={limitChoice}
          onValueChange={setLimitChoice}
          placeholder="Cantidad"
          modalTitle="Cantidad de sueños"
          disabled={loading}
        />

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

        {summary ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Resumen</Text>
            <Markdown style={markdownStyles} mergeStyle>
              {summary}
            </Markdown>
          </View>
        ) : null}
      </ScrollView>
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
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    lineHeight: 22,
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
