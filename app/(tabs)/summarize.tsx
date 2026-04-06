import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { apiErrorMessage, dreamSessionsService } from '@/services';
import { colors, gradients, radius, spacing, typography } from '@/theme';

export default function SummarizeScreen() {
  const bg = gradients.background;
  const insets = useSafeAreaInsets();
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSummarize = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await dreamSessionsService.summarizeRecent();
      setSummary(res.summary);
    } catch (e) {
      setSummary(null);
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

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
            Toma tus últimos 6 sueños con narrativa y muestra patrones que se repiten, sin
            guardar nada en el servidor.
          </Text>
        </View>

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
            <Text style={styles.resultBody}>{summary}</Text>
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
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultBody: {
    fontSize: typography.sizes.md,
    color: colors.text,
    lineHeight: 24,
  },
});
