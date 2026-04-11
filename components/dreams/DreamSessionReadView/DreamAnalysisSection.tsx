import { StyleSheet, Text, View } from 'react-native';
import { dreamPerspectiveLabel } from '@/services';
import { colors, spacing, typography } from '@/theme';

type DreamAnalysisSectionProps = {
  lucidityLevel?: number;
  perspectives: string[];
};

export function DreamAnalysisSection({
  lucidityLevel,
  perspectives,
}: DreamAnalysisSectionProps) {
  const hasLucidity = lucidityLevel != null && lucidityLevel >= 0;
  const hasPerspectives = perspectives.length > 0;

  if (!hasLucidity && !hasPerspectives) return null;

  return (
    <>
      {hasLucidity ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lucidez</Text>
          <Text style={styles.lucidityLabel}>{lucidityLevel} / 10</Text>
          <View style={styles.lucidityTrack}>
            <View
              style={[
                styles.lucidityFill,
                { width: `${Math.min(100, (lucidityLevel / 10) * 100)}%` },
              ]}
            />
          </View>
        </View>
      ) : null}

      {hasPerspectives ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perspectivas</Text>
          {perspectives.map((p, i) => (
            <View key={`${i}-${p.slice(0, 24)}`} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bodyText}>{dreamPerspectiveLabel(p)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bodyText: {
    fontSize: typography.sizes.md,
    lineHeight: 24,
    color: colors.textSecondary,
    flex: 1,
  },
  lucidityLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  lucidityTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  lucidityFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  bullet: {
    fontSize: typography.sizes.md,
    color: colors.accent,
    marginTop: 2,
  },
});
